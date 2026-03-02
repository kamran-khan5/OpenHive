import { getRandomUsers, getTopCreators } from "@/actions/user.action";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import Link from "next/link";
import { Avatar, AvatarImage } from "./ui/avatar";
import FollowButton from "./FollowButton";

export const RightSidebar = async () => {
  const [users, topCreators] = await Promise.all([
    getRandomUsers(),
    getTopCreators(3),
  ]);

  return (
    <div className="space-y-6 w-full">
      {/* TOP CREATORS */}
      <Card>
        <CardHeader>
          <CardTitle className="text-yellow-400 flex items-center gap-2">
            ⭐ Top Creators
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {topCreators.map((creator, index) => (
            <Link
              key={creator.id}
              href={`/profile/${creator.username}`}
              className="flex items-center justify-between text-sm hover:opacity-80 transition"
            >
              <div className="flex items-center gap-2">
                <span>{index === 0 ? "🏆" : index === 1 ? "🥈" : "🥉"}</span>
                <span>{creator.username}</span>
              </div>

              <div className="flex items-center gap-1 text-cyan-400">
                <span>👥</span>
                <span>
                  {creator._count.followers.toLocaleString()} followers
                </span>
              </div>
            </Link>
          ))}
        </CardContent>
      </Card>

      {/* WHO TO FOLLOW */}
      {users.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Who to Follow</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex gap-2 items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <Link href={`/profile/${user.username}`}>
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={user.image ?? "/avatar.png"} />
                      </Avatar>
                    </Link>
                    <div className="text-xs">
                      <Link
                        href={`/profile/${user.username}`}
                        className="font-medium hover:underline"
                      >
                        {user.name}
                      </Link>
                      <p className="text-muted-foreground">@{user.username}</p>
                      <p className="text-muted-foreground">
                        {user._count.followers} followers
                      </p>
                    </div>
                  </div>
                  <FollowButton userId={user.id} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* FOOTER LINKS */}
      <div className="text-xs text-muted-foreground space-y-2 px-2">
        <div className="flex flex-wrap gap-3">
          <Link href="/about" className="hover:underline">
            About
          </Link>
          <Link href="/terms" className="hover:underline">
            Terms
          </Link>
          <Link href="/privacy" className="hover:underline">
            Privacy
          </Link>
          <Link href="/careers" className="hover:underline">
            Careers
          </Link>
          <Link href="/help" className="hover:underline">
            Help
          </Link>
        </div>

        <p className="pt-2">© 2026 OPenHive</p>
      </div>
    </div>
  );
};
