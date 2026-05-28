import { MassUploadPanel } from "../components/mass-upload-panel";

export default async function MassUploadPage() {
    return (
        <div className="h-full">
            <MassUploadPanel />
        </div>
    );
}

export const getConfig = async () => {
    return {
        render: "dynamic",
    } as const;
};
