import RootLayout from "@/component/layout/Layout";
import { useDispatch, useSelector } from "react-redux";
import { RootStore } from "@/store/store";
import Table from "@/extra/Table";
import Pagination from "@/extra/Pagination";
import { useEffect, useState } from "react";
import Analytics from "@/extra/Analytic";
import { getVipPlanPurchaseHistory } from "@/store/userSlice";
import { getDefaultCurrency } from "@/store/settingSlice";
import CoinPlanTable from "../Shimmer/CoinPlanTable";
import { formatCoins } from "@/utils/Common";

const VipPlanHistory = () => {
  const dispatch = useDispatch();
  const { dialogue, dialogueType } = useSelector(
    (state: RootStore) => state.dialogue
  );
  const userData =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("userData") || "null")
      : null;
  const { defaultCurrency } = useSelector((state: RootStore) => state.setting);
  const { userVipPlanHistory, totalVipPlanHistory } = useSelector(
    (state: RootStore) => state.user
  );
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [page, setPage] = useState<number>(1);
  const [startDate, setStartDate] = useState("All");
  const [endDate, setEndDate] = useState("All");

  useEffect(() => {
    dispatch(getDefaultCurrency());
  }, []);

  useEffect(() => {
    const payload = {
      start: page,
      limit: rowsPerPage,
      id: userData?._id,
      startDate,
      endDate,
    };
    dispatch(getVipPlanPurchaseHistory(payload));
  }, [dispatch, page, rowsPerPage, startDate, endDate]);

  const handleChangePage = (event: any, newPage: any) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: any) => {
    setRowsPerPage(parseInt(event, 10));
    setPage(1);
  };

  const vipPlanTable = [
    {
      Header: "No",
      Cell: ({ index }: { index: any }) => (
        <span> {(page - 1) * rowsPerPage + parseInt(index) + 1}</span>
      ),
    },

    {
      Header: "UniqueId",
      Cell: ({ row }: { row: any }) => (
        <span className="text-capitalize">{row?.uniqueId || "-"}</span>
      ),
    },

    {
      Header: "Coin",
      Cell: ({ row }: { row: any }) => (
        <span className="text-capitalize">{formatCoins(row?.userCoin)}</span>
      ),
    },

    {
      Header: "Validity",
      Cell: ({ row }: { row: any }) => (
        <span className="text-capitalize">{row?.validity || 0}</span>
      ),
    },

    {
      Header: "Validity Type",
      Cell: ({ row }: { row: any }) => (
        <span className="text-capitalize">{row?.validityType || 0}</span>
      ),
    },

    {
      Header: "Payment Gateway",
      Cell: ({ row }: { row: any }) => (
        <span className="text-capitalize">{row?.paymentGateway || "-"}</span>
      ),
    },

    {
      Header: `Price (${defaultCurrency?.symbol})`,
      Cell: ({ row }: { row: any }) => (
        <span className="text-capitalize">{row?.price || 0}</span>
      ),
    },
  ];

  return (
    <>
      <div className="row d-flex align-items-center pt-3">
        <div
          className="col-12 col-lg-6 col-md-6 col-sm-12 fs-20 fw-600"
          style={{ color: "#404040" }}
        ></div>

        <div className="col-md-6 col-6 mb-0 d-flex justify-content-end">
          <Analytics
            analyticsStartDate={startDate}
            analyticsStartEnd={endDate}
            analyticsStartDateSet={setStartDate}
            analyticsStartEndSet={setEndDate}
            direction={"end"}
          />
        </div>
      </div>

      <div className="mt-2">
        <div style={{ marginBottom: "32px" }}>
          <Table
            data={userVipPlanHistory}
            mapData={vipPlanTable}
            PerPage={rowsPerPage}
            Page={page}
            type={"server"}
            shimmer = {<CoinPlanTable />}

          />
        </div>
        <Pagination
          type={"server"}
          serverPage={page}
          setServerPage={setPage}
          serverPerPage={rowsPerPage}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          totalData={totalVipPlanHistory}
        />
      </div>
    </>
  );
};

VipPlanHistory.getLayout = function getLayout(page: React.ReactNode) {
  return <RootLayout>{page}</RootLayout>;
};
export default VipPlanHistory;
