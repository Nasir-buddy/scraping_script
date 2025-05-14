import { Box, Heading, Text, Button, Flex, IconButton } from "@radix-ui/themes";
import { FC } from "react";
import Image from 'next/image';
import { useFormContext } from "../FormContext";

interface MarketBasicsCard2Props {
    onNext: () => void;
    onBack?: () => void;
}

export const MarketBasicsCard2: FC<MarketBasicsCard2Props> = ({ onNext, onBack }) => {
    const { formData, updateFormData, isLoading } = useFormContext();

    const handleInputChange = (value: string) => {
        updateFormData({ idealClient: value });
    };

    return (
        <Box className="rounded-2xl bg-[#1A1A1A] p-8 w-full" style={{ width: 1070, height: 770, position: 'relative' }}>
            <Heading
                as="h2"
            className="font-sans text-white font-normal"
            style={{
                width: 188,
                height: 36,
                top: 26,
                left: 24,
                letterSpacing: 0,
                lineHeight: '36px',
                fontSize: 30,
            }}
        >
            Market Basics
        </Heading>
        <Box className="flex flex-col gap-4 mt-6 w-full">
            <Text className="text-white font-normal text-[20px] leading-[32px] tracking-[0] align-middle">
                Help me understand your clients. It&apos;s important to know who we&apos;re selling to.
            </Text>
            <Box className="rounded-xl bg-[#111111]" style={{ height: 412, position: 'relative', padding: 24, overflow: 'hidden' }}>
                <Box className="flex justify-between">
                    <Text className="text-white font-normal text-[20px] leading-[28px] tracking-[0] mb-4">
                        Who is your ideal client? What do we know about their demographics, their pains, needs and desires. The more you can share the better.
                    </Text>
                    <IconButton
                        variant="ghost"
                        size="2"
                        className="text-[#4D4D4D]"
                        aria-label="Edit"
                        
                        disabled={isLoading}
                    >
                        <Image
                            src="/datacapture/Icon Button.svg"
                            alt="Edit"
                            width={44}
                            height={44}
                            loading="lazy"
                        />
                    </IconButton>
                </Box>
                <textarea
                    value={formData.idealClient}
                    onChange={(e) => handleInputChange(e.target.value)}
                    placeholder="Describe it here."
                    className="bg-[#111111] text-[20px] font-normal rounded-xl resize-none focus:outline-none border-none shadow-none leading-[28px] w-full text-white box-border pt-[6px] h-[313px] overflow-auto m-0"
                    disabled={isLoading}
                />

            </Box>
        </Box>
        <Flex
            justify="between"
            className="absolute right-8 bottom-8"
            style={{ width: '60%' }}
        >
            <Button
                size="3"
                className="bg-[#222] text-white min-w-[250px] h-10 rounded-[24px] mr-6"
                onClick={onBack}
            >
                Back
            </Button>
            <Button
                size="3"
                className="bg-[#3EC4A1] text-[#111] min-w-[265px] h-10 rounded-[24px]"
                onClick={onNext}
            >
                Next
            </Button>
        </Flex>
    </Box>
    );
};

export default MarketBasicsCard2; 