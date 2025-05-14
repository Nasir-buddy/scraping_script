import { Box, Text } from "@radix-ui/themes";

const chartData = [6, 12, 10, 18, 15, 24, 10, 24, 14, 20, 16, 8]; // 12 bars, normalized
const highlightedIndex = 7; // 8th bar is highlighted
const maxBarHeight = 12; // increased height in rem

export function RoiCard() {
  return (
    <Box className="min-w-[26.5rem] max-w-[26.5rem] w-full h-[22.5rem] rounded-3xl bg-[#1A1A1A] p-6 flex flex-col box-border">
     <Box 
        className="w-[277px] h-[100px] "
      >
     <Text
       size="3"
       weight="medium"
       className="text-white font-normal text-[24px] leading-[32px] tracking-[0]"
     >
        Overall Account ROI
      </Text><br />
      <Text className="text-white my-2 mb-4 w-[231px] h-[60px] font-normal text-[48px] leading-[60px] tracking-[0]">
        0%
      </Text>
     </Box>
      <Box 
        className="flex items-end gap-2" 
        style={{ 
          flex: 1,
          width: '100%',
          marginTop: '1rem'
        }}
      >
        {chartData.map((val, i) => (
          <Box
            key={i}
            className={[
              "flex-1",
              "transition-colors",
              "duration-200",
              "ease-in-out",
              "rounded-t-lg",
              i === 0 ? "rounded-bl-lg" : "",
              i === chartData.length - 1 ? "rounded-br-lg" : "",
            ].join(" ")}
            style={{
              height: `${(val / Math.max(...chartData)) * 100}%`,
              background: i === highlightedIndex ? '#3EC4A1' : '#4D4D4D',
            }}
          />
        ))}
      </Box>
    </Box>
  );
}

export default RoiCard; 