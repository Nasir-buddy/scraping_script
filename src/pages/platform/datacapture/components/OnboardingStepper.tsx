import { Box, Flex, Text, IconButton } from "@radix-ui/themes";
import { ArrowRightIcon } from "@radix-ui/react-icons";
import Image from 'next/image';

const steps = [
  { label: "Market basics" },
  { label: "Campaigns basics" },
  { label: "Connect Ads" },
  { label: "Connect Funnels" },
];

export interface OnboardingStepperProps {
  current?: number;
  onStepClick?: (stepIdx: number) => void;
}

export function OnboardingStepper({ current = 0, onStepClick }: OnboardingStepperProps) {
  return (
    <Box
      className="rounded-2xl bg-[#1A1A1A] pl-5 pt-6 w-[424px] h-[360px] top-[487px] left-[112px]"
    >
      <Text className="text-white w-[158px] h-[36px] font-normal text-[30px] tracking-[0]">
        Onboarding
      </Text>
      <Flex direction="column" gap="3" style={{ marginTop: 20 }}>
        {steps.map((step, idx) => {
          const isCompleted = idx < current;
          const isActive = idx === current;
          const circleBg = isActive || isCompleted ? '#3EC4A14D' : '#111111';
          const circleColor = isActive || isCompleted ? '#3EC4A1' : '#fff';
          const displayNumber = idx + 1;
          return (
            <Flex key={step.label}>
              <Flex align="center" gap="3">
                <Flex
                  align="center"
                  justify="center"
                  className="w-12 h-12 rounded-full font-bold text-[18px]"
                  style={{
                    background: circleBg,
                    color: circleColor,
                  }}
                >
                  {displayNumber}
                </Flex>
                <Box className="flex items-center justify-between w-[341px] h-[48px] rounded-full" style={{ background: '#111111' }}>
                  <Text
                    size="3"
                    className="h-[24px] font-bold rounded-full ml-5"
                    style={{ top: 24, left: 20 }}
                  >
                    {step.label}
                  </Text>
                  <IconButton
                    variant="ghost"
                    size="1"
                    className="w-[33px] h-[33px] rounded-full bg-[#171717] mr-[10px]"
                    onClick={() => onStepClick?.(idx)}
                  >
                    <Image
                      src="/datacapture/Arrow_Up_Right_MD.svg"
                      alt="Go to step"
                      width={18}
                      height={18}
                      loading="lazy"
                      className="block"
                    />
                  </IconButton>
                </Box>
              </Flex>
            </Flex>
          );
        })}
      </Flex>
    </Box>
  );
}

export default OnboardingStepper; 