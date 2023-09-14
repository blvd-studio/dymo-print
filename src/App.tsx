import { FC, ReactNode } from "react";
import { useState, useMemo, memo } from "react";
import {
  useDymoCheckService,
  useDymoFetchPrinters,
  useDymoOpenLabel,
  printLabel,
} from "react-dymo-hooks";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { generateXmlExample } from "./components/utils";

interface DymoLabelPreviewProps {
  xml: string;
  statusDymoService: "loading" | "error" | "success";
  loadingComponent: ReactNode;
  errorComponent: ReactNode;
}

const DymoLabelPreview: FC<DymoLabelPreviewProps> = memo(
  ({ xml, statusDymoService, loadingComponent, errorComponent }) => {
    const { label, statusOpenLabel } = useDymoOpenLabel(statusDymoService, xml);
    const style = { background: "hsla(0, 0%, 50%, 0.20)", padding: 7 };
    if (statusOpenLabel === "loading") {
      return loadingComponent;
    } else if (statusOpenLabel === "error") {
      return errorComponent;
    } else if (statusOpenLabel === "success") {
      return (
        <>
          <img
            src={"data:image/png;base64," + label}
            alt="dymo label preview"
            style={style}
          />
        </>
      );
    }
  }
);

const StatusService: FC<{ status: string }> = ({ status }) => {
  if (status === "loading") {
    return <div className="text-sm">Checking dymo web service...</div>;
  }

  if (status === "error") {
    return (
      <>
        <Badge variant="destructive">error</Badge>
      </>
    );
  }

  if (status === "success") {
    return (
      <>
        <Badge variant="secondary">service is running</Badge>
      </>
    );
  }

  return null;
};

const App: FC = () => {
  const statusDymoService = useDymoCheckService();
  const { statusFetchPrinters, printers } =
    useDymoFetchPrinters(statusDymoService);

  const [itemName, setItemName] = useState<string>("");
  const [qrcode, setQrCode] = useState<string>("");
  const [itemID, setItemID] = useState<string>("");
  const [selectedPrinter, setSelectedPrinter] = useState<string | null>(null);

  const xmlMemo = useMemo(
    () => generateXmlExample(itemName, itemID, qrcode),
    [itemName, itemID, qrcode]
  );

  async function handlePrintSingleLabel(printerName: string, labelXml: string) {
    try {
      const response = await printLabel(printerName, labelXml);
      console.info(response);
    } catch (error) {
      console.error(error);
    }
  }
  return (
    <div>
      <div className="flex h-screen">
        <div className="w-[300px] h-full p-5">
          <>
            <div className="py-5">
              Status: <StatusService status={statusDymoService} />
            </div>
            <div className="py-2">
              <Label>Item name</Label>
              <Input
                value={itemName}
                title="itemName"
                onChange={(e) => setItemName(e.target.value)}
              />
            </div>
            <div className="py-2">
              <Label>Item ID</Label>
              <Input
                value={itemID}
                title="itemID"
                onChange={(e) => setItemID(e.target.value)}
              />
            </div>
            <div className="py-2">
              <Label>QR code</Label>
              <Input
                value={qrcode}
                title="qrcode"
                onChange={(e) => setQrCode(e.target.value)}
              />
            </div>
            {statusFetchPrinters === "loading" && <h4>Loading printers..</h4>}
            {statusFetchPrinters === "success" && (
              <>
                <label htmlFor="printer-select">Choose a Dymo printer:</label>
                <br />
                <select
                  name="printers"
                  id="printer-select"
                  onChange={(e) => setSelectedPrinter(e.target.value)}
                >
                  <option value="">--Please choose an option--</option>
                  {printers.map((printer) => (
                    <option key={printer.name} value={printer.name}>
                      {printer.name}
                    </option>
                  ))}
                </select>
              </>
            )}
            <div className="py-5">
              <Button
                disabled={!selectedPrinter}
                onClick={() => handlePrintSingleLabel(selectedPrinter, xmlMemo)}
              >
                Print Label
              </Button>
            </div>
          </>
        </div>

        <div className="flex-grow bg-gray-300 flex items-center justify-center">
          <DymoLabelPreview
            xml={xmlMemo}
            statusDymoService={statusDymoService}
            loadingComponent={<h4>Loading Preview...</h4>}
            errorComponent={<h4>Error..</h4>}
          />
        </div>
      </div>
    </div>
  );
};

export default App;
