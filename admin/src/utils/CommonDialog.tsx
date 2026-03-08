import logout from "@/assets/images/logOut.png"
import deleteIcon from "@/assets/images/delete.svg";
import acceptIcon from "@/assets/images/accept.svg";


const CommonDialog = ({ open, onCancel, onConfirm, text }: any) => {

    if (!open) return null;

  
      

    return (
        <div className="dialog">
            <div className="w-100">
                <div className="row justify-content-center">
                    <div className="col-xl-3 col-md-4 col-11">
                        <div className="commonmainDiaogBox">


                            <img
                                src={text == "Delete" ? deleteIcon.src : text=== "Accept" ? acceptIcon.src : logout.src}
                                height={30}
                                width={30}
                                style={{ objectFit: "contain" }}
                            />

                            <h5 className="logout mt-4"
                            style={{color : text === "Accept" ? "rgb(51 201 53)" : ""}}
                            >{text}</h5>

                            <p className="commontext mt-3">
                                {`Are you sure you want to ${text} ?`}</p>
                            <div className="d-flex gap-3">
                                <button className="cancel-button mt-3"
                                    onClick={onCancel}
                                >
                                    Cancel
                                </button>

                                <button className="logout-button mt-3"
                                style={{background : text === "Accept" ? "rgb(51 201 53)" : ""}}
                                    onClick={onConfirm}

                                >
                                    {text}
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