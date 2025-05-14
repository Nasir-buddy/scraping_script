import { Box, Heading, Text, TextArea, Button, Flex, IconButton } from "@radix-ui/themes";
import { FC } from "react";
import Image from 'next/image';
import { useFormContext } from "../FormContext";

interface MarketBasicsCardProps {
    onNext: () => void;
    onBack?: () => void;
}

export const MarketBasicsCard: FC<MarketBasicsCardProps> = ({ onNext, onBack }) => {
    const { formData, updateFormData, isLoading } = useFormContext();

    const handleInputChange = (value: string) => {
        updateFormData({ mainProduct: value });
    };

    return (
        <Box className="rounded-2xl bg-[#1A1A1A] p-8 w-full" style={{ width: 1070, height: 770, position: 'relative' }}>
            <Heading
                className="font-sans text-white font-normal"
            style={{
                width: '188px',
                height: '36px',
                top: '26px',
                left: '24px',
                letterSpacing: '0',
                lineHeight: '36px',
                fontSize: '30px',
            }}
        >
            Market Basics
        </Heading>
        <Box className="flex flex-col gap-4 mt-6 w-full">
            <Text className="text-white font-normal text-[20px] leading-[32px] tracking-[0] align-middle">
                Help me understand your business a bit.
            </Text>
            <Box className="rounded-xl bg-[#111111]" style={{ minHeight: 140, position: 'relative', padding: 24 }}>
                <Box className="flex justify-between">
                    <Text className="text-white font-normal text-[20px] leading-[28px] tracking-[0] mb-4">
                        What are the main product(s) you are selling?
                    </Text>
                    <IconButton
                        variant="ghost"
                        size="2"
                        style={{ color: '#4D4D4D' }}
                        aria-label="Attach file"
                    >
                        <Image
                            src="/datacapture/Icon Button.svg"
                            alt="Attach file"
                            width={44}
                            height={44}
                            loading="lazy"
                        />
                    </IconButton>
                </Box>
                <textarea
                    value={formData.mainProduct}
                    onChange={(e) => handleInputChange(e.target.value)}
                    placeholder="Describe it here."
                    className="bg-[#111111] text-[20px] font-normal rounded-xl resize-none focus:outline-none border-none shadow-none leading-[28px] w-full text-white box-border pt-[6px] h-[313px] m-0"
                    disabled={isLoading}
                />

            </Box>
        </Box>
        <Flex
            justify="end"
            className="absolute right-8 bottom-8"
            style={{ width: 'calc(100% - 64px)' }}
        >
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

export default MarketBasicsCard; 