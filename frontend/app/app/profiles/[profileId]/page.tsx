import { redirect } from "next/navigation";

interface AppProfileDetailsPageProps {
  params: {
    profileId: string;
  };
}

export default function AppProfileDetailsPage({
  params,
}: AppProfileDetailsPageProps) {
  redirect(`/app/profiles/${params.profileId}/chat`);
}
