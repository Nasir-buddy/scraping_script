import { Box, Heading, Text, Button, Flex } from "@radix-ui/themes";
import * as Select from '@radix-ui/react-select';
import { ChevronDownIcon } from '@radix-ui/react-icons';
import { FC } from "react";
import Image from 'next/image';
import { useFormContext } from "../FormContext";

interface ConnectEmailCampaignsCardProps {
    onNext: () => void;
    onBack: () => void;
}

export const ConnectEmailCampaigns: FC<ConnectEmailCampaignsCardProps> = ({ onNext, onBack }) => {    
    const { formData, updateFormData, isLoading } = useFormContext();

    const handleInputChange = (key: keyof typeof formData, value: string) => {
        updateFormData({ [key]: value });
    };

    return (
        <Box className="rounded-2xl bg-[#1A1A1A] p-8 w-full" style={{ width: 1070, height: 770, position: 'relative' }}>
            <Heading
                as="h2"
                className="font-sans"
                style={{
                    color: '#fff',
                    height: 36,
                    top: 26,
                    left: 24,
                    fontWeight: 400,
                    letterSpacing: 0,
                    lineHeight: '36px',
                    fontSize: 30,
                    marginBottom: 50
                }}
            >
                Connect Email Campaigns
            </Heading>
            <Box className="flex flex-col gap-4 mt-6 w-full">
                <Text style={{
                    color: "#fff",
                    fontWeight: 400,
                    fontSize: 20,
                    letterSpacing: 0,
                    lineHeight: '32px',
                    initialLetter: 0,
                    verticalAlign: 'middle',
                    marginBottom: 50
                }}>
                   Add all Email campaigns that are contributing to your marketing campaigns.
                </Text>
            </Box>

            <Flex className="flex-col w-[90%] h-[427px]">

            <Box className=" flex flex-col mb-20">
                    <Text
                        className="font-[400] mb-6 text-[16px]"
                        style={{
                            letterSpacing: '0%',
                            lineHeight: '140%',
                        }}
                    >
                        [Some Campaign name set up on previous step]
                    </Text>
                    <Flex align="center" className="mb-6" style={{ gap: 16 }}>
                       <Box className="flex w-full">
                       <Text className="text-[16px] text-white mr-8" style={{ minWidth: 80 }}>Email Sequence</Text>
                        <input
                            type="text"
                            value={formData.emailSequence}
                            onChange={e => handleInputChange('emailSequence', e.target.value)}
                            placeholder="Select campaign (select as many as needed) "
                            className="w-[60%] bg-[#141414] text-white rounded-lg border-none outline-none text-[16px] radius-[6px] color-[#fff] p-2 font-normal leading-[140%] placeholder-white"
                            disabled={isLoading}
                        />
                       </Box>
                        <Select.Root
                            value={formData.emailSequencePurpose}
                            onValueChange={value => handleInputChange('emailSequencePurpose', value)}
                            disabled={isLoading}
                        >
                            <Select.Trigger
                                className="inline-flex items-center justify-between rounded-lg px-4 py-2 bg-[#222] text-white text-[16px] font-normal leading-[140%] outline-none"
                                style={{ minWidth: 140 }}
                                aria-label="Purpose"
                            >
                                <Select.Value placeholder="Purpose" />
                                <Select.Icon>
                                    <ChevronDownIcon style={{ color: '#545454' }} />
                                </Select.Icon>
                            </Select.Trigger>
                            <Select.Portal>
                                <Select.Content className="rounded-lg bg-[#222] text-[16px] text-white">
                                    <Select.Viewport>
                                        <Select.Item value="newsletter" className="px-4 py-2 cursor-pointer">
                                            <Select.ItemText>Newsletter</Select.ItemText>
                                        </Select.Item>
                                        <Select.Item value="promotion" className="px-4 py-2 cursor-pointer">
                                            <Select.ItemText>Promotion</Select.ItemText>
                                        </Select.Item>
                                    </Select.Viewport>
                                </Select.Content>
                            </Select.Portal>
                        </Select.Root>
                    </Flex>
                </Box>
                
                <Box className=" flex flex-col mb-20">
                    <Text
                        className="font-[400] mb-6 text-[16px]"
                        style={{
                            letterSpacing: '0%',
                            lineHeight: '140%',
                        }}
                    >
                        [Some Campaign name set up on previous step]
                    </Text>
                    <Flex align="center" className="mb-6" style={{ gap: 16 }}>
                       <Box className="flex w-full">
                       <Text className="text-[16px] text-white mr-8" style={{ minWidth: 80 }}>Email Sequence</Text>
                        <input
                            type="text"
                            value={formData.emailSequence2}
                            onChange={e => handleInputChange('emailSequence2', e.target.value)}
                            placeholder="Select campaign (select as many as needed) "
                            className="w-[60%] bg-[#141414] text-white rounded-lg border-none outline-none text-[16px] radius-[6px] color-[#fff] p-2 font-normal leading-[140%] placeholder-white"
                            disabled={isLoading}
                        />
                       </Box>
                        <Select.Root
                            value={formData.emailSequence2Purpose}
                            onValueChange={value => handleInputChange('emailSequence2Purpose', value)}
                            disabled={isLoading}
                        >
                            <Select.Trigger
                                className="inline-flex items-center justify-between rounded-lg px-4 py-2 bg-[#222] text-white text-[16px] font-normal leading-[140%] outline-none"
                                style={{ minWidth: 140 }}
                                aria-label="Purpose"
                            >
                                <Select.Value placeholder="Purpose" />
                                <Select.Icon>
                                    <ChevronDownIcon style={{ color: '#545454' }} />
                                </Select.Icon>
                            </Select.Trigger>
                            <Select.Portal>
                                <Select.Content className="rounded-lg bg-[#222] text-[16px] text-white">
                                    <Select.Viewport>
                                        <Select.Item value="newsletter" className="px-4 py-2 cursor-pointer">
                                            <Select.ItemText>Newsletter</Select.ItemText>
                                        </Select.Item>
                                        <Select.Item value="promotion" className="px-4 py-2 cursor-pointer">
                                            <Select.ItemText>Promotion</Select.ItemText>
                                        </Select.Item>
                                    </Select.Viewport>
                                </Select.Content>
                            </Select.Portal>
                        </Select.Root>
                    </Flex>
                </Box>


            </Flex>
            <Flex
                justify="between"
                className="absolute right-8 bottom-8 w-[60%]"
            >
                <Button
                    size="3"
                    className="bg-[#222] text-white min-w-[250px] h-10 rounded-3xl mr-6"
                    onClick={onBack}
                >
                    Back
                </Button>
                <Button
                    size="3"
                    className="bg-[#3EC4A1] text-[#111] min-w-[265px] h-10 rounded-3xl"
                    onClick={onNext}
                    disabled={isLoading}
                >
                    Next
                </Button>
            </Flex>
        </Box>
    );
}; 