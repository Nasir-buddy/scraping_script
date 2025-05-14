import { Box, Flex } from "@radix-ui/themes";
import { RoiCard } from "./RoiCard";
import { MarketBasicsCard } from "./SidePages/MarketBasicsCard";
import { CampaignBasicsCard } from "./SidePages/CampaignBasicsCard";
import { OnboardingStepper } from "./OnboardingStepper";
import { MarketBasicsCard2 } from "./SidePages/MarketBasicsCard2";
import { ConnectAds } from './SidePages/ConnectAds';
import { ConnectFunnels } from "./SidePages/ConnectFunnels";
import { ConnectEmailCampaigns } from "./SidePages/ConnectEmailCampaigns";
import { useState } from "react";
import { FormProvider, useFormContext } from "./FormContext";

function getStepperStep(step: number) {
  if (step === 0 || step === 1) return 0;
  if (step === 2) return 1;
  if (step === 3) return 2;
  if (step === 4) return 3;
  if (step === 5) return 4;
  return 0;
}

function mapStepperToInternalStep(stepperIdx: number, currentStep: number) {
  if (stepperIdx === 0) {
    return currentStep === 0 ? 1 : 0;
  }
  if (stepperIdx === 1) return 2;
  if (stepperIdx === 2) return 3;
  if (stepperIdx === 3) return 4;
  if (stepperIdx === 4) return 5;
  return 0;
}

function DataCaptureForm() {
    const [step, setStep] = useState(0);
    const { isLoading, updateCurrentForm } = useFormContext();

    function handleNext() {
        setStep((prev) => (prev < 5 ? prev + 1 : prev));
    }

    function handleBack() {
        setStep((prev) => (prev > 0 ? prev - 1 : prev));
    }

    function handleFinalSubmit() {
        // Ensure we're sending a complete form with all fields
        // No need to call addNewForm, just update the current form
        updateCurrentForm()
            .then((result) => {
                console.log("Form data updated successfully:", result);
                // Handle successful submission (e.g., redirect or show success message)
            })
            .catch(error => {
                console.error("Error updating form data:", error);
                // Handle error
            });
    }

    if (isLoading) {
        return (
            <Flex justify="center" align="center" style={{ width: '100%', height: '100%' }}>
                <Box className="p-4">Loading...</Box>
            </Flex>
        );
    }

    return (
        <Flex direction="row" gap="8" style={{ width: '100%', height: '100%', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 50 }}>
            {/* Left Panel */}
            <Box style={{ width: 360, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 45 }}>
                <RoiCard />
                <OnboardingStepper current={getStepperStep(step)} onStepClick={(idx) => setStep(mapStepperToInternalStep(idx, step))} />
            </Box>
            {/* Right Panel */}
            <Box style={{ borderRadius: 24, backgroundColor: '#111111', marginLeft: 60, marginRight: 100, minWidth: 700, }}>
                {/* Debug: Show current step */}
                {step === 0 && (
                    <MarketBasicsCard onNext={handleNext} />
                )}
                {step === 1 && (
                    <MarketBasicsCard2 onNext={handleNext} onBack={handleBack} />
                )}
                {step === 2 && (
                    <CampaignBasicsCard onNext={handleNext} onBack={handleBack} />
                )}
                {step === 3 && (
                    <ConnectAds onNext={handleNext} onBack={handleBack} />
                )}
                {step === 4 && (
                    <ConnectFunnels onNext={handleNext} onBack={handleBack} />
                )}
                {step === 5 && (
                    <ConnectEmailCampaigns 
                        onNext={handleFinalSubmit} 
                        onBack={handleBack} 
                    />
                )}
            </Box>
        </Flex>
    );
}

export function DataCaptureMain() {
    return (
        <FormProvider>
            <DataCaptureForm />
        </FormProvider>
    );
}

export default DataCaptureMain; 