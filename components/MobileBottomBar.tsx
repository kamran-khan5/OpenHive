// "use client";

// import Link from "next/link";
// import { HomeIcon, PlusIcon, UserIcon } from "lucide-react";

// import { useCreatePostModal } from "@/context/CreatePostModal.context";
// import { currentUser } from "@clerk/nextjs/server";

// export const MobileBottomBar = async () => {
//   const user = await currentUser();
//   const { openModal } = useCreatePostModal();

//   const profileHref = `/profile/${
//                 user?.username ?? user?.emailAddresses[0].emailAddress.split("@")[0]
//               }`;

//   return (
//     <div className="fixed bottom-0 left-0 w-full bg-background/95 backdrop-blur z-50 border-t md:hidden">
//       <div className="max-w-7xl mx-auto px-4 flex justify-around items-center h-16">
//         <Link
//           href="/"
//           className="flex flex-col items-center text-xs text-muted-foreground hover:text-primary"
//         >
//           <HomeIcon className="w-5 h-5" />
//           <span>Home</span>
//         </Link>

//         <button
//           onClick={() => openModal("image")}
//           className="flex flex-col items-center text-xs text-muted-foreground hover:text-primary"
//         >
//           <PlusIcon className="w-5 h-5" />
//           <span>Post</span>
//         </button>

//         <Link
//           href={profileHref}
//           className="flex flex-col items-center text-xs text-muted-foreground hover:text-primary"
//         >
//           <UserIcon className="w-5 h-5" />
//           <span>Profile</span>
//         </Link>
//       </div>
//     </div>
//   );
// };


import { currentUser } from "@clerk/nextjs/server";
import { MobileBottomBarClient } from "./MobileBottomBar.client";


export const MobileBottomBar = async () => {
  const user = await currentUser();
  const profileHref = `/profile/${
    user?.username ?? user?.emailAddresses[0].emailAddress.split("@")[0]
  }`;

  return <MobileBottomBarClient profileHref={profileHref} />;
};