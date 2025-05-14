import { Box, Heading, Text, TextArea, Button, Flex, IconButton, DropdownMenu } from "@radix-ui/themes";
import { FC } from "react";
import Image from 'next/image';
import { useFormContext } from "../FormContext";

interface ConnectAdsCardProps {
    onNext: () => void;
    onBack: () => void;
}

export const ConnectAds: FC<ConnectAdsCardProps> = ({ onNext, onBack }) => {
    const { formData, updateFormData, isLoading } = useFormContext();
    
    const campaignOptions = [
        { label: 'Meta', value: 'meta' },
        { label: 'Google', value: 'google' },
    ];
    const metaCampaignOptions = [
        { label: '[Meta campaign names pulled from API]', value: 'meta-campaign-1' },
        { label: 'Meta Campaign 2', value: 'meta-campaign-2' },
    ];

    function handleDropdownValueChange(key: 'campaign' | 'metaCampaign', value: string) {
        updateFormData({ [key]: value });
    }

    return (
        <Box className="rounded-2xl bg-[#1A1A1A] p-8 w-full" style={{ width: 1070, height: 770, position: 'relative' }}>
            <Heading
                as="h2"
                className="font-sans text-white font-normal"
                style={{
                    width: 169,
                    height: 36,
                    top: 26,
                    left: 24,
                    letterSpacing: 0,
                    lineHeight: '36px',
                    fontSize: 30,
                    marginBottom: 50
                }}
            >
                Connect Ads
            </Heading>
            <Box className="flex flex-col gap-4 mt-6 w-full">
                    <Text className="text-white font-normal text-[20px] leading-[32px] tracking-[0] align-middle mb-[50px]">
                        Connect all sources of sources of paid traffic to your campaigns
                    </Text>
            </Box>

            <Flex className="flex-col w-full h-[427px]">
                <Box className="w-1/2 flex flex-col justify-start mb-12">
                    <Text
                        className="font-normal mb-6 text-[16px] leading-[140%] tracking-[0]"
                        style={{ letterSpacing: '0%' }}
                    >
                        [Some Campaign name set up on previous step]
                    </Text>
                    <DropdownMenu.Root>
                        <DropdownMenu.Trigger>
                            <Button
                                className="w-full text-left justify-between bg-[#141414] text-white pt-5 pb-5"
                                disabled={isLoading}
                            >
                                {campaignOptions.find(opt => opt.value === formData.campaign)?.label}
                                <span className="text-[#545454]"><DropdownMenu.TriggerIcon /></span>
                            </Button>
                        </DropdownMenu.Trigger>
                        <DropdownMenu.Content className="bg-[#141414]">
                            {campaignOptions.map(option => (
                                <DropdownMenu.Item
                                    key={option.value}
                                    onClick={() => handleDropdownValueChange('campaign', option.value)}
                                >
                                    {option.label}
                                </DropdownMenu.Item>
                            ))}
                        </DropdownMenu.Content>
                    </DropdownMenu.Root>
                    <DropdownMenu.Root>
                        <DropdownMenu.Trigger>
                            <Button
                                className="w-full text-left justify-between mt-6 bg-[#141414] text-white pt-5 pb-5"
                                disabled={isLoading}
                            >
                                {metaCampaignOptions.find(opt => opt.value === formData.metaCampaign)?.label || '[Meta campaign names pulled from API]'}
                                <span className="text-[#545454]"><DropdownMenu.TriggerIcon /></span>
                            </Button>
                        </DropdownMenu.Trigger>
                        <DropdownMenu.Content className="bg-[#141414]">
                            {metaCampaignOptions.map(option => (
                                <DropdownMenu.Item
                                    key={option.value}
                                    onClick={() => handleDropdownValueChange('metaCampaign', option.value)}
                                >
                                    {option.label}
                                </DropdownMenu.Item>
                            ))}
                        </DropdownMenu.Content>
                    </DropdownMenu.Root>
                </Box>
                <Box className="w-1/2 flex flex-col justify-start">
                    <Text className="font-normal mb-6 text-[16px] leading-[140%] tracking-[0]">
                        [Some Campaign name set up on previous step]
                    </Text>
                    <DropdownMenu.Root>
                        <DropdownMenu.Trigger>
                            <Button
                                className="w-full text-left justify-between bg-[#141414] text-white pt-5 pb-5"
                                disabled={isLoading}
                            >
                                {campaignOptions.find(opt => opt.value === formData.campaign)?.label}
                                <span className="text-[#545454]">
                                    <DropdownMenu.TriggerIcon />
                                </span>
                            </Button>
                        </DropdownMenu.Trigger>
                        <DropdownMenu.Content className="bg-[#141414]">
                            {campaignOptions.map(option => (
                                <DropdownMenu.Item
                                    key={option.value}
                                    onClick={() => handleDropdownValueChange('campaign', option.value)}
                                >
                                    {option.label}
                                </DropdownMenu.Item>
                            ))}
                        </DropdownMenu.Content>
                    </DropdownMenu.Root>
                    <DropdownMenu.Root>
                        <DropdownMenu.Trigger>
                            <Button
                                className="w-full text-left justify-between mt-6 bg-[#141414] text-white pt-5 pb-5"
                                disabled={isLoading}
                            >
                                {metaCampaignOptions.find(opt => opt.value === formData.metaCampaign)?.label || '[Meta campaign names pulled from API]'}
                                <span className="text-[#545454]"><DropdownMenu.TriggerIcon /></span>
                            </Button>
                        </DropdownMenu.Trigger>
                        <DropdownMenu.Content className="bg-[#141414]">
                            {metaCampaignOptions.map(option => (
                                <DropdownMenu.Item
                                    key={option.value}
                                    onClick={() => handleDropdownValueChange('metaCampaign', option.value)}
                                >
                                    {option.label}
                                </DropdownMenu.Item>
                            ))}
                        </DropdownMenu.Content>
                    </DropdownMenu.Root>
                </Box>
            </Flex>
            <Flex justify="between" style={{  position: 'absolute', right: 32, bottom: 32, width: '60%' }}>
                <Button
                    size="3"
                    className="min-w-[250px] h-[40px] rounded-[24px] mr-6 bg-[#222] text-white"
                    onClick={onBack}
                >
                    Back
                </Button>
                <Button size="3" style={{ background: '#3EC4A1', color: '#111', minWidth: 265, height: 40, borderRadius: 24 }}
                    onClick={onNext}
                    disabled={isLoading}
                >
                    Next
                </Button>
            </Flex>
        </Box>
    );
};
