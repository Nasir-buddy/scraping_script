import { Box, Heading, Text, Button, Flex, IconButton } from "@radix-ui/themes";
import Image from "next/image";
import { useFormContext } from "../FormContext";

interface CampaignBasicsCardProps {
    onNext: () => void;
    onBack: () => void;
}

interface CampaignBasicsField {
    key: "campaignName" | "campaignObjective";  // Use union type of allowed keys
    title: string;
    description: string;
}

const campaignBasicsFields: CampaignBasicsField[] = [
    {
        key: "campaignName",
        title: "Campaign name: What do we call this effort internally.",
        description: "Describe it here."
    },
    {
        key: "campaignObjective",
        title: "Campaign Objective. What are we trying to achieve.",
        description: "Describe it here."
    }
];

export function CampaignBasicsCard({ onNext, onBack }: CampaignBasicsCardProps) {
    const { formData, updateFormData, isLoading } = useFormContext();
    
    function handleInputChange(key: "campaignName" | "campaignObjective", value: string) {
        updateFormData({ [key]: value });
    }
    
    const handleNext = () => {
        onNext();
    };

    return (
        <Box
            className="rounded-2xl bg-[#1A1A1A] p-8 w-full flex flex-col"
            style={{
                width: 1070,
                height: 770,
                position: "relative",
                paddingBottom: 30
            }}
        >
            <Heading
                as="h2"
                className="font-sans text-white font-normal leading-[36px] text-[30px]"
            >
                Campaign basics
            </Heading>
            <Box className="flex flex-col gap-6 mt-6 w-full flex-1 min-h-0 overflow-y-auto mb-8">
                <Text className="text-white w-full font-normal text-[20px] leading-[32px]">
                    What marketing campaigns are you running right now to get new clients? Think of a campaign being a concerted effort within your company to achieve an objective, not a single specific ads campaign.
                </Text>
                {campaignBasicsFields.map(({ key, title, description }) => (
                    <Box
                        key={key}
                        className="rounded-xl bg-[#111111] flex flex-col gap-2 relative p-6"
                    >
                        <Box className="flex justify-between">
                            <Text className="text-white font-normal text-[20px] leading-[28px]">
                                {title}
                            </Text>
                            <IconButton
                                variant="ghost"
                                size="2"
                                aria-label="Attach file"
                                className="text-[#4D4D4D]"
                            >
                                <Image
                                    src="/datacapture/Icon Button.svg"
                                    alt="Attach file"
                                    width={44}
                                    height={44}
                                    loading="lazy"
                                    className="block m-0 p-0"
                                />
                            </IconButton>
                        </Box>
                        <Box>
                            <textarea
                                value={formData[key]}
                                onChange={e => handleInputChange(key, e.target.value)}
                                placeholder={description}
                                className="bg-[#111111] text-[20px] font-normal resize-none focus:outline-none border-none shadow-none leading-[28px] w-full text-white box-border m-0"
                                disabled={isLoading}
                            />
                        </Box>
                    </Box>
                ))}
            </Box>
            <Flex
                justify="between"
                className="absolute right-8 bottom-8"
                style={{ width: "90%" }}
            >
                <Button
                    size="3"
                    className="bg-[#222] text-white min-w-[250px] h-[40px] rounded-[24px] mr-6"
                    onClick={onBack}
                >
                    Back
                </Button>
                <Button
                    size="3"
                    className="bg-[#3EC4A1] text-[#111] min-w-[265px] h-[40px] rounded-[24px]"
                    onClick={handleNext}
                    disabled={isLoading}
                >
                    Next
                </Button>
            </Flex>
        </Box>
    );
}