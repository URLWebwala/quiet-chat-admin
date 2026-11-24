import RootLayout from "@/component/layout/Layout";
import Button from "@/extra/Button";
import image from "@/assets/images/bannerImage.png";
import { openDialog } from "@/store/dialogSlice";
import { useDispatch, useSelector } from "react-redux";
import { RootStore } from "@/store/store";
import Table from "@/extra/Table";
import Pagination from "@/extra/Pagination";
import { useEffect, useState } from "react";
import TrashIcon from "@/assets/images/delete.svg";
import EditIcon from "@/assets/images/edit.svg";
import { activeCreditPlan, deleteCreditPlan, getCreditPlan } from "@/store/creditPlanSlice";
import ToggleSwitch from "@/extra/TogggleSwitch";
import { getDefaultCurrency } from "@/store/settingSlice";
import CommonDialog from "@/utils/CommonDialog";
import { FaCoins } from "react-icons/fa";

const CreditPlan = ({ type }: any) => {
  const dispatch = useDispatch();
  const [showDialog, setShowDialog] = useState(false);
  const [selectedId, setSelectedId] = useState<any>(null);
  const { defaultCurrency } = useSelector((state: RootStore) => state.setting);
  const { creditPlan, total, isSkeleton } = useSelector((state: RootStore) => state.creditPlan);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [page, setPage] = useState<number>(1);

  useEffect(() => {
    const payload = {
      start: page,
      limit: rowsPerPage,
    };
    if (type === "creditPlan" || !type) {
      dispatch(getCreditPlan(payload));
    }
  }, [dispatch, page, rowsPerPage, type]);

  const handleChangePage = (event: any, newPage: any) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: any) => {
    setRowsPerPage(parseInt(event, 10));
    setPage(1);
  };

  useEffect(() => {
    dispatch(getDefaultCurrency());
  }, [dispatch]);

  const confirmDelete = async () => {
    if (selectedId) {
      await dispatch(deleteCreditPlan(selectedId));
      setShowDialog(false);
      dispatch(getCreditPlan({ start: page, limit: rowsPerPage }));
    }
  };

  const handleDelete = (id: any) => {
    setSelectedId(id);
    setShowDialog(true);
  };

  const creditPlanTable = [
    {
      Header: "No",
      Cell: ({ index }: { index: any }) => (
        <span>{(page - 1) * rowsPerPage + parseInt(index) + 1}</span>
      ),
    },
    {
      Header: "Credits",
      Cell: ({ row }: { row: any }) => (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "8px" }}>
          <div
            className="rounded-circle d-flex align-items-center justify-content-center text-white"
            style={{ width: "26px", height: "26px", background: "linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)" }}
          >
            <FaCoins size={12} />
          </div>
          <span className="fw-bold text-dark">{row?.credits?.toLocaleString() || 0} Credits</span>
        </div>
      ),
    },
    {
      Header: "Bonus Credits",
      Cell: ({ row }: { row: any }) => (
        <span className="fw-normal text-muted">
          {row?.bonusCredits > 0 ? `+${row.bonusCredits.toLocaleString()}` : "-"}
        </span>
      ),
    },
    {
      Header: `Offer Price (${defaultCurrency?.symbol || "₹"})`,
      Cell: ({ row }: { row: any }) => (
        <span className="fw-bold text-success">
          {defaultCurrency?.symbol || "₹"}{row?.price}
        </span>
      ),
    },
    {
      Header: `Actual Price (${defaultCurrency?.symbol || "₹"})`,
      Cell: ({ row }: { row: any }) => {
        const actual = row?.actualPrice && row?.actualPrice > row?.price ? row?.actualPrice : null;
        return (
          <span className="text-muted">
            {actual ? <s>{defaultCurrency?.symbol || "₹"}{actual}</s> : `${defaultCurrency?.symbol || "₹"}${row?.price}`}
          </span>
        );
      },
    },
    {
      Header: "Discount",
      Cell: ({ row }: { row: any }) => {
        const disc =
          row?.discount ||
          (row?.actualPrice > row?.price ? Math.round(((row.actualPrice - row.price) / row.actualPrice) * 100) : 0);
        return disc > 0 ? (
          <span className="badge bg-danger-subtle text-danger border border-danger-subtle fw-semibold">
            {disc}% OFF
          </span>
        ) : (
          <span className="text-muted">-</span>
        );
      },
    },
    {
      Header: "Product ID",
      Cell: ({ row }: { row: any }) => (
        <span className="fw-normal font-monospace text-break small">{row?.productId || "-"}</span>
      ),
    },
    {
      Header: "Active",
      body: "isActive",
      Cell: ({ row }: { row: any }) => (
        <ToggleSwitch
          value={row?.isActive}
          onClick={() => {
            const payload = {
              id: row?._id,
              type: "isActive",
            };
            dispatch(activeCreditPlan(payload));
          }}
        />
      ),
    },
    {
      Header: "Popular",
      body: "isFeatured",
      Cell: ({ row }: { row: any }) => (
        <ToggleSwitch
          value={row?.isFeatured}
          onClick={() => {
            const payload = {
              id: row?._id,
              type: "isFeatured",
            };
            dispatch(activeCreditPlan(payload));
          }}
        />
      ),
    },
    {
      Header: "Action",
      Cell: ({ row }: { row: any }) => (
        <div className="d-flex justify-content-center">
          <button
            className="me-2"
            style={{
              backgroundColor: "#CFF3FF",
              borderRadius: "8px",
              padding: "8px",
            }}
            onClick={() => {
              dispatch(openDialog({ type: "creditPlan", data: row }));
            }}
            title="Edit Plan"
          >
            <img src={EditIcon.src} alt="Edit Icon" width={22} height={22} />
          </button>
          <button
            style={{
              backgroundColor: "#FFE7E7",
              borderRadius: "8px",
              padding: "8px",
            }}
            onClick={() => handleDelete(row?._id)}
            title="Delete Plan"
          >
            <img src={TrashIcon.src} alt="Trash Icon" width={22} height={22} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      <CommonDialog
        open={showDialog}
        onCancel={() => setShowDialog(false)}
        onConfirm={confirmDelete}
        title="Delete Confirmation"
        description="Are you sure you want to delete this credit plan?"
      />

      <div className="userTable">
        <Table
          data={creditPlan || []}
          mapData={creditPlanTable}
          PerPage={rowsPerPage}
          Page={page}
          type={"server"}
        />
        <Pagination
          type="server"
          serverPage={page}
          setServerPage={setPage}
          serverPerPage={rowsPerPage}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          totalData={total}
        />
      </div>
    </>
  );
};

CreditPlan.getLayout = function getLayout(page: React.ReactNode) {
  return <RootLayout>{page}</RootLayout>;
};

export default CreditPlan;
