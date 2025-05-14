import { Box, Heading, Text, Button, Flex, Tabs } from "@radix-ui/themes";
import { FC, useState, useEffect } from "react";
import Image from 'next/image';
import { useFormContext } from "../FormContext";
import { ScrapedContentViewer } from "../../components/ScrapedContentViewer";

interface ConnectFunnelsCardProps {
    onNext: () => void;
    onBack: () => void;
}

export const ConnectFunnels: FC<ConnectFunnelsCardProps> = ({ onNext, onBack }) => {
    const { formData, updateFormData, isLoading, savedFormData } = useFormContext();
    const [currentDataCaptureId, setCurrentDataCaptureId] = useState<string>('');

    useEffect(() => {
        if (savedFormData?._id) setCurrentDataCaptureId(savedFormData._id);
    }, [savedFormData]);

    function handleUrlChange(index: number, value: string) {
        const updatedUrls = [...(formData.url || [])];
        updatedUrls[index] = value;
        updateFormData({ url: updatedUrls });
    }

    function handleAddUrl() {
        updateFormData({ url: [...(formData.url || []), ''] });
    }

    function handleRemoveUrl(index: number) {
        const updatedUrls = [...(formData.url || [])];
        updatedUrls.splice(index, 1);
        updateFormData({ url: updatedUrls });
    }

    return (
        <Box className="rounded-2xl bg-[#1A1A1A] p-8 w-full" style={{ width: 1070, minHeight: 770, position: 'relative' }}>
            <Heading
                as="h2"
                className="font-sans text-white font-normal leading-[36px] text-[30px] mb-[20px]"
                style={{ height: 36, letterSpacing: 0 }}
            >
                Connect Funnels
            </Heading>
            <Tabs.Root defaultValue="urls">
                <Tabs.List>
                    <Tabs.Trigger value="urls">Enter URLs</Tabs.Trigger>
                    {currentDataCaptureId && <Tabs.Trigger value="scraper">Website Content</Tabs.Trigger>}
                </Tabs.List>
                <Tabs.Content value="urls">
                    <Box className="flex flex-col gap-4 mt-6 w-full">
                        <Text className="text-white font-normal text-[20px] leading-[32px] tracking-[0] align-middle mb-[30px]">
                            Add all those steps your potential clients follow after clicking on an ad.
                        </Text>
                    </Box>
                    <Flex className="flex-col w-full mb-[80px]">
                        {(formData.url || []).map((urlValue, idx) => (
                            <Box key={idx} className="w-1/2 flex flex-col mb-12">
                                <Text className="font-normal mb-6 text-[16px] leading-[140%]" style={{ letterSpacing: '0%' }}>
                                    {formData.campaign || '[Campaign name]'}
                                </Text>
                                <Flex align="center" className="mb-6">
                                    <Text className="text-[16px] text-white min-w-[80px]">{`Step ${idx + 1}:`}</Text>
                                    <input
                                        type="text"
                                        value={urlValue}
                                        onChange={e => handleUrlChange(idx, e.target.value)}
                                        placeholder="Enter URL here"
                                        className="flex-1 bg-[#141414] text-white rounded-lg border-none outline-none text-[16px] font-normal leading-[140%] p-2 placeholder-white"
                                        disabled={isLoading}
                                    />
                                    <Button
                                        size="2"
                                        className="ml-2"
                                        style={{ background: 'rgba(255, 0, 0, 0.2)', color: '#fff' }}
                                        onClick={() => handleRemoveUrl(idx)}
                                        disabled={isLoading || (formData.url?.length ?? 0) <= 1}
                                    >
                                        Remove
                                    </Button>
                                </Flex>
                            </Box>
                        ))}
                        <Flex className="justify-end w-full">
                            <Button
                                size="3"
                                className="relative flex items-center gap-[6px] justify-center w-[137px] h-[32px] rounded-[24px]"
                                style={{ right: 0, background: 'rgba(62, 196, 161, 0.3)', color: '#3EC4A1' }}
                                onClick={handleAddUrl}
                                disabled={isLoading}
                            >
                                <Image
                                    src="/datacapture/plus-circle.svg"
                                    alt="Add Step"
                                    width={18}
                                    height={18}
                                    loading="lazy"
                                    style={{ display: 'inline-block', verticalAlign: 'middle' }}
                                />
                                Add Step
                            </Button>
                        </Flex>
                    </Flex>
                </Tabs.Content>
                <Tabs.Content value="scraper">
                    {currentDataCaptureId ? (
                        <Box style={{ paddingTop: '20px', paddingBottom: '80px' }}>
                            <ScrapedContentViewer dataCaptureId={currentDataCaptureId} />
                        </Box>
                    ) : (
                        <Box className="p-4 text-center">
                            <Text>Please save your data first to enable website scraping.</Text>
                        </Box>
                    )}
                </Tabs.Content>
            </Tabs.Root>
            <Flex justify="between" style={{ position: 'absolute', right: 32, bottom: 32, width: '60%' }}>
                <Button
                    size="3"
                    className="min-w-[250px] h-[40px] rounded-[24px] mr-6"
                    style={{ background: '#222', color: '#fff' }}
                    onClick={onBack}
                >
                    Back
                </Button>
                <Button
                    size="3"
                    className="min-w-[265px] h-[40px] rounded-[24px] bg-[#3EC4A1] text-[#111]"
                    onClick={onNext}
                    disabled={isLoading}
                >
                    Next
                </Button>
            </Flex>
        </Box>
    );
}; 