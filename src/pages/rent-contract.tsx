import { RentContractDemo } from "../components/rent-contract-demo";

export default async function RentContractPage() {
    return (
        <div className="h-full">
            <RentContractDemo />
        </div>
    );
}

export const getConfig = async () => {
    return {
        render: "dynamic",
    } as const;
};
