import { DevisDemo } from "../components/devis-demo";

export default async function DevisPage() {
    return (
        <div className="h-full">
            <DevisDemo />
        </div>
    );
}

export const getConfig = async () => {
    return {
        render: "dynamic",
    } as const;
};
