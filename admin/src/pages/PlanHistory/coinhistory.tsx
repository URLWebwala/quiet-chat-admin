import React from 'react';
import RootLayout from "@/component/layout/Layout";
import { useDispatch, useSelector } from "react-redux";
import { RootStore } from "@/store/store";
import Table from "@/extra/Table";
import Pagination from "@/extra/Pagination";
import { useEffect, useState } from "react";
import Analytics from "@/extra/Analytic";
import { useRouter } from "next/router";
import { retrieveCoinPlanPurchase } from '@/store/coinPlanSlice';
import { getDefaultCurrency } from '@/store/settingSlice';
import CoinPlanTable from '@/component/Shimmer/CoinPlanTable';
import Searching from '@/extra/Searching';
import { formatCoins } from '@/utils/number';

const CoinHistory = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const { id } = router.query;
  const { dialogueType } = useSelector((state: RootStore) => state.dialogue);
  const { userPlanPurchaseHistory, totalUserPlanPurchaseHistory } = useSelector(
    (state: any) => state.coinPlan

  );
  const { defaultCurrency } = useSelector((state: RootStore) => state.setting)

  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [page, setPage] = useState<number>(1);
  const [data, setData] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    dispatch(getDefaultCurrency())
  }, [dispatch])

  useEffect(() => {
    if (!id) return;

    const Id = Array.isArray(id) ? id[0] : id;
    const typeNumber = 7;

    const payload = {
      start: page,
      limit: rowsPerPage,
      userId: Id,
      type: typeNumber,
      search
    };

    dispatch(retrieveCoinPlanPurchase(payload));
  }, [dispatch, id, page, rowsPerPage, search]);

  const handleChangePage = (event: any, newPage: any) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: any) => {
    setRowsPerPage(parseInt(event, 10));
    setPage(1);
  };

  const handleFilterData = (filteredData: any) => {
    setPage(1);
    if (typeof filteredData === "string") {
      setSearch(filteredData);
    } else {
      setData(filteredData);
    }
  };

  const coinHistoryTable = [
    { Header: "No", Cell: ({ index }: any) => <span>{(page - 1) * rowsPerPage + parseInt(index) + 1}</span> },
    { Header: "UniqueId", Cell: ({ row }: any) => <span>{row?.uniqueId}</span> },
    { Header: "Payment Gateway", Cell: ({ row }: any) => <span>{row?.paymentGateway || "-"}</span> },
    { Header: `Price (${defaultCurrency?.currencyCode || '$'})`, Cell: ({ row }: any) => <span>{formatCoins(row?.price)}</span> },
    { Header: "Coin", Cell: ({ row }: any) => <span>{formatCoins(row?.coin)}</span> },
    { Header: "Date", Cell: ({ row }: any) => <span>{row?.date || "-"}</span> },
  ];



  return (
    <>
      <div className="row d-flex align-items-center pt-3">
        <div className="col-12 col-lg-6 col-md-6 col-sm-12 fs-20 fw-600"
          style={{ color: "#404040" }}
        >
          Coin Plan  History
        </div>
        <div className="col-12 col-lg-6 col-md-6 col-sm-12 fs-20 fw-600"
          style={{ color: "#404040" }}
        >
          <Searching
            type={`server`}
            data={userPlanPurchaseHistory}
            setData={setData}
            column={coinHistoryTable}
            serverSearching={handleFilterData}
            placeholder={"Search by Payment Gateway/Unique ID"}
          />
        </div>
      </div>

      <div className="mt-2">
        <Table
          data={userPlanPurchaseHistory || []}
          mapData={coinHistoryTable}
          PerPage={rowsPerPage}
          Page={page}
          type={"server"}
          shimmer={<CoinPlanTable />}
        />
        <Pagination
          type={"server"}
          serverPage={page}
          setServerPage={setPage}
          serverPerPage={rowsPerPage}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          totalData={totalUserPlanPurchaseHistory}
        />
      </div>
    </>
  );
};

CoinHistory.getLayout = (page: React.ReactNode) => <RootLayout>{page}</RootLayout>;

export default CoinHistory;
