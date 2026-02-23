import { MassUploadPanel } from '../components/mass-upload-panel';

export default async function MassUploadPage() {
  return (
    <div className="min-h-[calc(100vh-7rem)]">
      <MassUploadPanel />
    </div>
  );
}

export const getConfig = async () => {
  return {
    render: 'dynamic',
  } as const;
};
