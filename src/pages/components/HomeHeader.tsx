import { Box, Flex, Heading } from "@radix-ui/themes";

interface HomeHeaderProps {
  title: string;
}

const HomeHeader = ({ title }: HomeHeaderProps) => {
  return (
    <Box style={{ padding: "1rem", borderBottom: "1px solid #333" }}>
      <Flex align="center" justify="between">
        <Heading size="6" style={{ color: "white" }}>{title}</Heading>
      </Flex>
    </Box>
  );
};

export default HomeHeader; 