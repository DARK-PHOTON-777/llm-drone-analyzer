import type { BoxComponentProps, NumberInputProps } from "@mantine/core";
import {
	Box,
	Button,
	Fieldset,
	Flex,
	Group,
	Input,
	NumberInput,
	Select,
	SimpleGrid,
	Stack,
	TextInput,
	Title,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { zod4Resolver } from "mantine-form-zod-resolver";
import { forwardRef } from "react";
import type { Form as FormParameters } from "../../../api/schemas/parameters";
import {
	BladesSchema,
	CellsSchema,
	DEFAULT_FORM_VALUES,
	DroneTypeSchema,
	FrameSizeSchema,
	MaterialSchema,
	NumMotorsSchema,
	ParameterSchema,
	PWMSchema,
} from "../../../api/schemas/parameters";
import type { Variance } from "../../../api/schemas/variance";

export const VarianceInput = ({
	label,
	value = { nominal: 0, variance: 0 },
	onChange,
	error,
	decimalScale,
	...props
}: {
	value?: Variance;
	onChange?: (value: Variance) => void;
} & Omit<NumberInputProps, "value" | "onChange">) => {
	return (
		<Input.Wrapper label={label} error={error}>
			<Group grow preventGrowOverflow={false} wrap="nowrap" gap="xs">
				<NumberInput
					flex={3}
					decimalScale={decimalScale}
					value={value.nominal}
					onChange={(val: number | string) => {
						onChange?.({
							...value,
							nominal:
								typeof val === "number"
									? val
									: parseInt(val, 10),
						});
					}}
					{...props}
				/>
				<NumberInput
					flex={1}
					min={0}
					max={100}
					rightSection={
						<Flex align="center" display="flex" h="100%">
							<span style={{ lineHeight: 1 }}>%</span>
						</Flex>
					}
					value={value.variance}
					onChange={(val: number | string) => {
						onChange?.({
							...value,
							variance:
								typeof val === "number"
									? val
									: parseInt(val, 10),
						});
					}}
					{...props}
				/>
			</Group>
		</Input.Wrapper>
	);
};

export const Form = forwardRef<
	HTMLFormElement,
	{
		onFormSubmit: (parameters: FormParameters) => void;
		isLoading: boolean;
		isPending: boolean;
	} & BoxComponentProps
>(({ onFormSubmit, isLoading, isPending, ...props }, ref) => {
	const form = useForm<FormParameters>({
		mode: "controlled",
		initialValues: DEFAULT_FORM_VALUES,
		validate: zod4Resolver(ParameterSchema),
	});

	return (
		<Box
			ref={ref}
			component="form"
			onSubmit={form.onSubmit((values) => onFormSubmit(values))}
			w="full"
			{...props}
		>
			<Stack>
				<Title order={3}>Parameters</Title>

				<Fieldset legend="Electrical">
					<Stack>
						<Fieldset legend="Battery">
							<SimpleGrid cols={{ base: 1, sm: 2 }}>
								<Select
									label="Cells"
									data={CellsSchema.options}
									{...form.getInputProps(
										"electrical.battery.cells",
									)}
								/>
								<NumberInput
									label="Capacity (mAh)"
									allowNegative={false}
									allowDecimal={false}
									{...form.getInputProps(
										"electrical.battery.capacity",
									)}
								/>
								<NumberInput
									label="C-Rating (A)"
									allowNegative={false}
									allowDecimal={false}
									{...form.getInputProps(
										"electrical.battery.c_rating",
									)}
								/>
								<VarianceInput
									label="Internal Resistance (mΩ)"
									allowDecimal={false}
									{...form.getInputProps(
										"electrical.battery.internal_resistance",
									)}
								/>
							</SimpleGrid>
						</Fieldset>
						<Fieldset legend="ESC">
							<SimpleGrid cols={{ base: 1, sm: 2 }}>
								<Select
									label="PWM Frequency (kHz)"
									data={PWMSchema.options}
									{...form.getInputProps(
										"electrical.esc.pwm_frequency",
									)}
								/>
								<NumberInput
									label="Current Limit (A)"
									allowNegative={false}
									allowDecimal={false}
									{...form.getInputProps(
										"electrical.esc.current_limit",
									)}
								/>
							</SimpleGrid>
						</Fieldset>
					</Stack>
				</Fieldset>

				<Fieldset legend="Propulsion">
					<Stack>
						<Fieldset legend="Motor">
							<SimpleGrid cols={{ base: 1, sm: 2 }}>
								<TextInput
									label="Size (e.g. 2207)"
									{...form.getInputProps(
										"propulsion.motor.size",
									)}
								/>
								<VarianceInput
									label="KV (RPM/V)"
									{...form.getInputProps(
										"propulsion.motor.kv",
									)}
								/>
								<NumberInput
									label="Idle Current (A)"
									allowNegative={false}
									{...form.getInputProps(
										"propulsion.motor.idle_current",
									)}
								/>
								<NumberInput
									label="Max Current (A)"
									allowNegative={false}
									{...form.getInputProps(
										"propulsion.motor.max_current",
									)}
								/>
							</SimpleGrid>
						</Fieldset>
						<Fieldset legend="Propeller">
							<SimpleGrid cols={{ base: 1, sm: 2 }}>
								<Select
									label="Blade Count"
									data={BladesSchema.options}
									{...form.getInputProps(
										"propulsion.prop.blades",
									)}
								/>
								<VarianceInput
									label="Diameter (in)"
									decimalScale={2}
									{...form.getInputProps(
										"propulsion.prop.diameter",
									)}
								/>
								<VarianceInput
									label="Pitch (in)"
									decimalScale={2}
									{...form.getInputProps(
										"propulsion.prop.pitch",
									)}
								/>
								<Select
									label="Material"
									data={MaterialSchema.options}
									{...form.getInputProps(
										"propulsion.prop.material",
									)}
								/>
							</SimpleGrid>
						</Fieldset>
					</Stack>
				</Fieldset>

				<Fieldset legend="Structural">
					<SimpleGrid cols={{ base: 1, sm: 2 }}>
						<Select
							label="Number of Motors"
							data={NumMotorsSchema.options}
							{...form.getInputProps("structural.num_motors")}
						/>
						<Select
							label="Frame Size (in)"
							data={FrameSizeSchema.options}
							{...form.getInputProps("structural.frame_size")}
						/>
						<VarianceInput
							label="All-Up Weight (g)"
							{...form.getInputProps("structural.mass")}
						/>
						<Select
							label="Drone Type"
							data={DroneTypeSchema.options}
							{...form.getInputProps("structural.type")}
						/>
					</SimpleGrid>
				</Fieldset>

				<Group justify="center">
					<Button
						variant="filled"
						disabled={isLoading}
						loading={isPending}
						type="submit"
					>
						Execute Monte Carlo Simulation
					</Button>
				</Group>
			</Stack>
		</Box>
	);
});
