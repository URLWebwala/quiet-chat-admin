import RootLayout from "@/component/layout/Layout";
import { RootStore, useAppDispatch } from "@/store/store";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import UserInfo from "../UserInfo";
import UserFollowingList from "./UserFollowingList";
import HostBlock from "./HostBlock";
import { routerChange } from "@/utils/Common";
import { useRouter } from "next/router";

const UserInfoPage = () => {
  const { dialogueType } = useSelector((state: RootStore) => state.dialogue);

  const dispatch = useAppDispatch();
  const [search, setSearch] = useState<string | undefined>("ALL");
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [page, setPage] = useState<number>(0);
  const [type, setType] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const storedType = localStorage.getItem("userType") || "profile";
    if (storedType) setType(storedType);
  }, []);

  useEffect(() => {
    if (type) {
      localStorage.setItem("userType", type);
    }
  }, [type]);

  useEffect(() => {
    routerChange("/UserInfoPage", "userType", router);
  }, []);

  return (
    <>
      <div
        className={`userTable ${
          dialogueType === "doctor" ? "d-none" : "d-block"
        }`}
      >
        <div className="my-2 user_profile_width">
          <button
            type="button"
            className={`${type === "profile" ? "activeBtn" : "disabledBtn"}`}
            onClick={() => setType("profile")}
          >
            Profile
          </button>
          <button
            type="button"
            className={`${
              type === "following list" ? "activeBtn" : "disabledBtn"
            }`}
            onClick={() => setType("following list")}
          >
            Follwing List
          </button>
          <button
            type="button"
            className={`${
              type === "host_block" ? "activeBtn" : "disabledBtn"
            } ms-1`}
            onClick={() => setType("host_block")}
          >
            Host Block
          </button>
        </div>

        {type === "profile" ? (
          <UserInfo />
        ) : type === "following list" ? (
          <UserFollowingList />
        ) : type === "host_block" ? (
          <HostBlock />
        ) : null}
      </div>
    </>
  );
};
UserInfoPage.getLayout = function getLayout(page: React.ReactNode) {
  return <RootLayout>{page}</RootLayout>;
};
export default UserInfoPage;
