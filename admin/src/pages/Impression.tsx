import image from "@/assets/images/bannerImage.png";
import TrashIcon from "@/assets/images/delete.svg";
import EditIcon from "@/assets/images/edit.svg";
import ImpressionDialog from "@/component/impression/ImpressionDialog";
import RootLayout from "@/component/layout/Layout";
import ImpressionShimmer from "@/component/Shimmer/ImpressionShimmer";
import Button from "@/extra/Button";
import Pagination from "@/extra/Pagination";
import Table from "@/extra/Table";
import { openDialog } from "@/store/dialogSlice";
import { deleteImpression, getImpression } from "@/store/impressionSlice";
import { RootStore } from "@/store/store";
import CommonDialog from "@/utils/CommonDialog";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

const Impression = () => {
  const dispatch = useDispatch();
  const { dialogue, dialogueType } = useSelector(
    (state: RootStore) => state.dialogue
  );

  const { impression, total } = useSelector(
    (state: RootStore) => state.impression
  );
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [page, setPage] = useState<number>(1);
  const [showDialog, setShowDialog] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    const payload = {
      start: page,
      limit: rowsPerPage,
    };
    dispatch(getImpression(payload));
  }, [dispatch, page, rowsPerPage]);

  const handleChangePage = (event: any, newPage: any) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: any) => {
    setRowsPerPage(parseInt(event, 10));
    setPage(1);
  };

  const handleDelete = (id: any) => {
  

    setSelectedId(id);
    setShowDialog(true);
  };

  const confirmDelete = async () => {
    if (selectedId) {
      dispatch(deleteImpression(selectedId));
      setShowDialog(false);
    }
  };

  const impressionTable = [
    {
      Header: "No",
      Cell: ({ index }: { index: any }) => (
        <span> {(page - 1) * rowsPerPage + parseInt(index) + 1}</span>
      ),
    },

    {
      Header: "Name",
      Cell: ({ row }: { row: any }) => (
        <span className="text-capitalize">{row?.name || "-"}</span>
      ),
    },

    {
      Header: "Created At",
      Cell: ({ row }: { row: any }) => {
        const date = new Date(row?.createdAt);
        const formattedDate = isNaN(date.getTime())
          ? "-"
          : date.toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "long",
              year: "numeric",
            });
        return <span>{formattedDate}</span>;
      },
    },

    {
      Header: "Updated At",
      Cell: ({ row }: { row: any }) => {
        const date = new Date(row?.updatedAt);
        const formattedDate = isNaN(date.getTime())
          ? "-"
          : date.toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "long",
              year: "numeric",
            });
        return <span>{formattedDate}</span>;
      },
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
              dispatch(openDialog({ type: "impression", data: row }));
            }}
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
          >
            <img src={TrashIcon.src} alt="Trash Icon" width={22} height={22} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      {dialogueType === "impression" && <ImpressionDialog />}
      <CommonDialog
        open={showDialog}
        onCancel={() => setShowDialog(false)}
        onConfirm={confirmDelete}
        text={"Delete"}
      />

      <div className="row">
        <div
          className="col-12 col-lg-6 col-md-6 col-sm-12 giftcategoryclass fw-600"
          style={{ color: "#404040" }}
        >
          Host tags
        </div>
        <div className="col-lg-6 col-sm-12 new-fake-btn d-flex justify-content-end align-items-center">
          <div className="dashboardHeader primeHeader mb-3 p-0"></div>

          <div className="betBox">
            <Button
              className={`bg-button p-10 text-white m10-bottom text-nowrap`}
              bIcon={image}
              text="Add Host Tags"
              onClick={() => {
                dispatch(openDialog({ type: "impression" }));
              }}
            />
          </div>
        </div>
      </div>
      <div>
        <Table
          data={impression}
          mapData={impressionTable}
          PerPage={rowsPerPage}
          Page={page}
          type={"server"}
          shimmer={<ImpressionShimmer />}
        />
        <div className="mt-5">
          <Pagination
            type={"server"}
            serverPage={page}
            setServerPage={setPage}
            serverPerPage={rowsPerPage}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            totalData={total}
          />
        </div>
      </div>
    </>
  );
};

Impression.getLayout = function getLayout(page: React.ReactNode) {
  return <RootLayout>{page}</RootLayout>;
};
export default Impression;
