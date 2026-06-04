import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { createTheme, MantineProvider } from "@mantine/core";
import {
	MutationCache,
	QueryClient,
	QueryClientProvider,
} from "@tanstack/react-query";
import { App } from "./App.tsx";

const queryClient = new QueryClient({
	mutationCache: new MutationCache({
		onError: (error) => {
			console.error(error);
		},
	}),
});

const theme = createTheme({
	colors: {
		gold: [
			"#fef8e4",
			"#f7efd4",
			"#ebddad",
			"#e0ca83",
			"#d6ba5f",
			"#d2b450",
			"#cdab3a",
			"#b5962b",
			"#a18522",
			"#8b7214",
		],
	},
	primaryColor: "gold",
	primaryShade: { light: 4, dark: 4 },
});

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<MantineProvider theme={theme} forceColorScheme="dark">
			<QueryClientProvider client={queryClient}>
				<App />
			</QueryClientProvider>
		</MantineProvider>
	</StrictMode>,
);
