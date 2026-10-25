import { MultimeterTool } from "@/features/simulator/multimeter/tool/MultimeterTool";

export function MultimeterLabFull({ sessionId = null }: { sessionId?: string | null }) {
    void sessionId;
    return <MultimeterTool />;
}
