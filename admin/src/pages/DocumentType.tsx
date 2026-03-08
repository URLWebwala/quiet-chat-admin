import RootLayout from "@/component/layout/Layout";
import Button from "@/extra/Button";
import image from "@/assets/images/bannerImage.png";
import { openDialog } from "@/store/dialogSlice";
import { useDispatch, useSelector } from "react-redux";
import { RootStore } from "@/store/store";
import ImpressionDialog from "@/component/impression/ImpressionDialog";
import Table from "@/extra/Table";
import Pagination from "@/extra/Pagination";
import { useEffect, useState } from "react";
import { deleteImpression, getImpression } from "@/store/impressionSlice";
import Image from "next/image";
import TrashIcon from "@/assets/images/delete.svg";
import EditIcon from "@/assets/images/edit.svg";
import {  warning } from "@/utils/Alert";
import DocumentTypeDialog from "@/component/documentType/DocumentTypeDialog";
import { deleteDocumentType, getDocumentType } from "@/store/settingSlice";
import CommonDialog from "@/utils/CommonDialog";
import DocumentShimmer from "@/component/Shimmer/DocumentShimmer";

const DocumentType = () => {
  const dispatch = useDispatch();
  const { dialogue, dialogueType } = useSelector(
    (state: RootStore) => state.dialogue
  );
 
  const { documentType, total } = useSelector(
    (state: RootStore) => state.setting
  );
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [page, setPage] = useState<number>(1);
  const [showDialog, setShowDialog] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    dispatch(getDocumentType());
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
      dispatch(deleteDocumentType(selectedId));
      setShowDialog(false);
    }
  };

  const documentTypeTable = [
    {
      Header: "No",
      Cell: ({ index }: { index: any }) => (
        <span> {(page - 1) * rowsPerPage + parseInt(index) + 1}</span>
      ),
    },

    {
      Header: "Title",
      Cell: ({ row }: { row: any }) => (
        <span className="text-capitalize">{row?.title || "-"}</span>
      ),
    },

    {
      Header: "Action",
      Cell: ({ row }: { row: any }) => (
        <div className="action-button">
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
            onClick={() => {
              
              handleDelete(row?._id);
            }}
          >
            <img src={TrashIcon.src} alt="Trash Icon" width={22} height={22} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      {dialogueType === "impression" && <DocumentTypeDialog />}
      <CommonDialog
        open={showDialog}
        onCancel={() => setShowDialog(false)}
        onConfirm={confirmDelete}
        text={"Delete"}
      />

      <div
        className="row d-flex align-items-center"
        style={{ marginBottom: "0px" }}
      >
        <div
          className="col-12 col-lg-6 col-md-6 col-sm-12 fs-20 fw-600"
          style={{ color: "#404040" }}
        >
          {/* Identity Proof */}
        </div>
        <div
          className="col-6 new-fake-btn d-flex justify-content-end align-items-center"
          style={{ marginBottom: "0px" }}
        >
          <div className="dashboardHeader primeHeader mb-3 p-0"></div>

          <div className="betBox">
            <Button
              className={`bg-button p-10 text-white m10-bottom `}
              bIcon={image}
              text="Add Identity Proof"
              onClick={() => {
                
                dispatch(openDialog({ type: "impression" }));
              }}
            />
          </div>
        </div>
      </div>

      <div className="mt-2">
        <Table
          data={documentType}
          mapData={documentTypeTable}
          PerPage={rowsPerPage}
          Page={page}
          type={"server"}
          shimmer={<DocumentShimmer />}
        />
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
    </>
  );
};

DocumentType.getLayout = function getLayout(page: React.ReactNode) {
  return <RootLayout>{page}</RootLayout>;
};
export default DocumentType;
