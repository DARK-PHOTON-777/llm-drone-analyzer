import type { Config, Context } from "@netlify/functions";
import { QuerySchema } from "../../api/schemas/query";
import { logger } from "../logger";
import { createPrompt } from "../prompt";

export default async (req: Request, _context: Context) => {
	let body: string;

	try {
		body = await req.text();
	} catch (_e) {
		return new Response(JSON.stringify({ error: "Missing body" }), {
			status: 400,
		});
	}

	const parsed = QuerySchema.safeParse(JSON.parse(body || ""));

	if (!parsed.success) {
		return new Response(
			JSON.stringify({
				error: "Invalid Input",
			}),
			{ status: 400, headers: { "Content-Type": "application/json" } },
		);
	}

	const prompt = createPrompt(parsed.data);

	try {
		const res = await fetch(
			"https://openrouter.ai/api/v1/chat/completions",
			{
				method: "POST",
				headers: {
					Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					model:
						process.env.OPENROUTER_MODEL ||
						"anthropic/claude-3.5-sonnet",
					temperature: 0.2,
					stream: true,
					messages: [
						{ role: "system", content: prompt.system },
						{ role: "user", content: prompt.user },
					],
				}),
			},
		);

		if (!res.ok) {
			const errorText = await res
				.text()
				.catch(() => "Unknown error body");
			return new Response(
				JSON.stringify({
					error: `OpenRouter rejected request with status ${res.status}`,
					details: errorText,
				}),
				{
					status: res.status,
					headers: { "Content-Type": "application/json" },
				},
			);
		}

		if (!res.body) {
			return new Response(
				JSON.stringify({ error: "OpenRouter response body is null" }),
				{
					status: 500,
					headers: { "Content-Type": "application/json" },
				},
			);
		}

		const textStream = new ReadableStream({
			async start(controller) {
				const reader = res.body!.getReader();
				const decoder = new TextDecoder();
				try {
					while (true) {
						const { done, value } = await reader.read();
						if (done) break;

						const lines = decoder.decode(value).split("\n");
						for (const line of lines) {
							if (!line.startsWith("data: ")) continue;
							const data = line.slice(6).trim();
							if (data === "[DONE]") continue;
							try {
								const delta =
									JSON.parse(data)?.choices?.[0]?.delta
										?.content;
								if (delta) controller.enqueue(delta);
							} catch {}
						}
					}
				} catch (err) {
					logger.error(err, "Stream generation broken mid-flight");
				} finally {
					controller.close();
				}
			},
		}).pipeThrough(new TextEncoderStream());

		return new Response(textStream, {
			headers: {
				"Content-Type": "text/plain; charset=utf-8",
				"Transfer-Encoding": "chunked",
			},
		});
	} catch (error) {
		logger.error(error, "OpenRouter Agent Error");

		return new Response(
			JSON.stringify({
				response:
					"Sorry, I had an internal error when computing recommendations.",
			}),
			{ status: 500, headers: { "Content-Type": "application/json" } },
		);
	}
};

export const config: Config = {
	path: "/api/query",
	method: "POST",
};
