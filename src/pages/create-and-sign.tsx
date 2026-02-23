import { CreateAndSign } from "../components/create-and-sign.js";

export default async function CreateAndSignPage() {
    return (
        <div className="min-h-[calc(100vh-7rem)]">
            <CreateAndSign />
        </div>
    );
}

export const getConfig = async () => {
    return {
        render: "dynamic",
    } as const;
};
