import logout from "@/assets/images/logOut.png"
import deleteIcon from "@/assets/images/delete.svg";
import acceptIcon from "@/assets/images/accept.svg";


const CommonDialog = ({ open, onCancel, onConfirm, text, title, description }: any) => {

    if (!open) return null;

    return (
        <div className="dialog" style={{ zIndex: 1070 }}>
            <div className="w-100">
                <div className="row justify-content-center m-0">
                    <div className="col-xl-3 col-md-4 col-11 d-flex justify-content-center">
                        <div className="commonmainDiaogBox text-center" style={{ width: "100%", maxWidth: "360px" }}>
                            <img
                                src={text == "Delete" ? deleteIcon.src : text=== "Accept" ? acceptIcon.src : logout.src}
                                height={35}
                                width={35}
                                style={{ objectFit: "contain" }}
                            />

                            <h5 className="logout mt-3 mb-1"
                            style={{color : text === "Accept" ? "rgb(51 201 53)" : "#151920", fontWeight: 700, fontSize: "18px"}}
                            >{title || text}</h5>

                            <p className="commontext mt-2 mb-0" style={{ fontSize: "14px", color: "#64748b", lineHeight: "1.5" }}>
                                {description || `Are you sure you want to ${text} ?`}</p>
                            <div className="d-flex gap-3 justify-content-center mt-4">
                                <button className="cancel-button m-0"
                                    type="button"
                                    onClick={onCancel}
                                >
                                    Cancel
                                </button>

                                <button className="logout-button m-0"
                                    type="button"
                                    style={{background : text === "Accept" ? "rgb(51 201 53)" : "#ff0004"}}
                                    onClick={onConfirm}
                                >
                                    {text || "Confirm"}
                                </button>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    )
}

export default CommonDialog