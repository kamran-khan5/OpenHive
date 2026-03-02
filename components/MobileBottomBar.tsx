import { currentUser } from "@clerk/nextjs/server";
import { MobileBottomBarClient } from "./MobileBottomBar.client";


export const MobileBottomBar = async () => {
  const user = await currentUser();
  const profileHref = `/profile/${
    user?.username ?? user?.emailAddresses[0].emailAddress.split("@")[0]
  }`;

  return <MobileBottomBarClient profileHref={profileHref} />;
};