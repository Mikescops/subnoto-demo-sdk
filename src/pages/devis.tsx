import { DevisDemo } from "../components/devis-demo";

export default async function DevisPage() {
    return (
        <div className="min-h-[calc(100vh-7rem)]">
            <DevisDemo />
        </div>
    );
}

export const getConfig = async () => {
    return {
        render: "dynamic",
    } as const;
};
