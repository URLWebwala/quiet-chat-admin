import GiftCategoryDialog from "@/component/giftCategory/GiftCategoryDialog";
import RootLayout from "@/component/layout/Layout";
import Button from "@/extra/Button";
import Pagination from "@/extra/Pagination";
import Table from "@/extra/Table";
import Title from "@/extra/Title";
import ToggleSwitch from "@/extra/TogggleSwitch";
import { openDialog } from "@/store/dialogSlice";
import { deleteGiftCategory, getGiftCategory } from "@/store/giftSlice";
import { RootStore, useAppDispatch } from "@/store/store";
import { warning } from "@/utils/Alert";
import image from "@/assets/images/bannerImage.png";
import EditIcon from "@/assets/images/edit.svg";
import TrashIcon from "@/assets/images/delete.svg";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import Image from "next/image";
import CommonDialog from "@/utils/CommonDialog";
import ImpressionShimmer from "@/component/Shimmer/ImpressionShimmer";

interface BannerData {
  _id: string;
  image: string;
  isActive: false;
}

const GiftCategory = () => {
  const { dialogue, dialogueType } = useSelector(
    (state: RootStore) => state.dialogue
  );
 
  const [showDialog, setShowDialog] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  const { giftCategory, totalGiftCategory } = useSelector(
    (state: RootStore) => state.gift
  );
  const router = useRouter();

  const dispatch = useAppDispatch();

  const [data, setData] = useState<any[]>([]);
  const [rowsPerPage, setRowsPerPage] = useState<number>(20);
  const [page, setPage] = useState<any>(1);

  useEffect(() => {
    const payload: any = {
      start: page,
      limit: rowsPerPage,
    };
    dispatch(getGiftCategory(payload));
  }, [page, rowsPerPage]);

  const handleChangePage = (event: any, newPage: any) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: any) => {
    setRowsPerPage(parseInt(event, 10));
    setPage(1);
  };

  const bannerTable = [
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
      Cell: ({ row }: { row: BannerData }) => (
        <div className="d-flex justify-content-center mx-auto">
          <button
            className="me-2"
            style={{
              backgroundColor: "#CFF3FF",
              borderRadius: "8px",
              padding: "8px",
            }}
            onClick={() => {
              dispatch(openDialog({ type: "giftCategory", data: row }));
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

  const confirmDelete = async () => {
    if (selectedId) {
      dispatch(deleteGiftCategory(selectedId));
      setShowDialog(false);
    }
  };
  const handleDelete = (id: any) => {
   
    setSelectedId(id);
    setShowDialog(true);
  };

  return (
    <>
      {dialogueType === "giftCategory" && <GiftCategoryDialog />}
      <CommonDialog
        open={showDialog}
        onCancel={() => setShowDialog(false)}
        onConfirm={confirmDelete}
        text={"Delete"}
      />
      <div className={`userTable`}>
        <div className="d-flex justify-content-between align-items-center">
          <div
            className="text-capitalized fw-600 giftcategoryclass"
            style={{ color: "#404040" }}
          >
            Gift Category
          </div>

          <div className="betBox">
            <Button
              className={`bg-button p-10 text-white `}
              bIcon={image}
              text="Gift Category"
              onClick={() => {
                dispatch(openDialog({ type: "giftCategory" }));
              }}
            />
          </div>
        </div>
        <div className="mt-4">
          <div style={{ maxHeight: "1000px", overflowY: "auto" }}>
            <Table
              style={{ width: "100%" }}
              data={giftCategory}
              mapData={bannerTable}
              PerPage={rowsPerPage}
              Page={page}
              type={"server"}
              shimmer={<ImpressionShimmer />}
            />
          </div>

          <div className="mt-5">
            <Pagination
              type={"server"}
              serverPage={page}
              setServerPage={setPage}
              serverPerPage={rowsPerPage}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              totalData={totalGiftCategory}
            />
          </div>
        </div>
      </div>
    </>
  );
};
GiftCategory.getLayout = function getLayout(page: React.ReactNode) {
  return <RootLayout>{page}</RootLayout>;
};
export default GiftCategory;
