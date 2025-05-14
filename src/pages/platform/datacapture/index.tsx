import { Box, Container, Heading, Grid, Flex } from "@radix-ui/themes";
import HomeHeader from "../../components/HomeHeader";
import VerticalNav from "../../components/VerticalNav";
import DataCaptureMain from "./components/DataCaptureMain";

export function DataCapturePage() {
  return (
    <Box style={{ backgroundColor: "#000000", height: "100vh", margin: 0 }}>
      <HomeHeader title="Data Capture" />
      <Flex direction="row" style={{ height: "100%" }}>
        <Box
          className="flex-shrink-0"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "4rem",
            height: "100vh",
            backgroundColor: "#000000",
          }}
        >
          <VerticalNav />
        </Box>

        <Box
          style={{
            marginLeft: "4rem",
            width: "calc(100% - 4rem)",
            padding: "1rem",
            overflowY: "auto",
          }}
        >
          <DataCaptureMain />
        </Box>
      </Flex>
    </Box>
  );
}

export default DataCapturePage;