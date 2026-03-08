import Button from "@/extra/Button";
import { ExInput, Textarea } from "@/extra/Input";
import { closeDialog } from "@/store/dialogSlice";
import {
  createGiftCategory,
  getGiftCategory,
  updateGiftCategory,
} from "@/store/giftSlice";
import { RootStore, useAppDispatch } from "@/store/store";
import React, { useEffect, useState } from "react";
import ReactSelect from "react-select";
import { useSelector } from "react-redux";
import { color } from "html2canvas/dist/types/css/types/color";
import { createAgency } from "@/store/agencySlice";
import { genderData } from "@/utils/extra";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import ReactDropzone, { FileWithPath, Accept } from "react-dropzone";
import moment, { lang } from "moment";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import { IconButton } from "@mui/material";
import { baseURL } from "@/utils/config";
import { createHost, getImpression, updateHost } from "@/store/hostSlice";
import Select from "react-select";
import countriesData from "@/api/countries.json";

interface ErrorState {
  name: string;
  email: string;
  Dob: string;
  language: string;
  impression: string;
  country: string;
  countryFlagImage: string;
  image: string;
  bio: string;
  gender: string;
  images: string;
  video: string;
  videocall: string;
  videolive: string;
  profilevideo: string;
  privateCallRate: string;
  randomCallFemaleRate: string;
  randomCallMaleRate: string;
  randomCallRate: string;
}

interface FileOperations {
  add: {
    images: File[];
    videocall: File[];
    videolive: File[];
    profilevideo: File[];
  };
  remove: {
    images: number[]; // indices
    videocall: number[];
    videolive: number[];
    profilevideo: number[];
  };
}

interface ErrorState {
  name: string;
  email: string;
  Dob: string;
  language: string;
  country: string;
  image: string;
  impression: string;
  gender: string;
  bio: string;
  images: string;
  video: string;
  videocall: string;
  videolive: string;
  profilevideo: string;
}

const HostDialog = () => {
  
  const [startDate, setStartDate] = useState(moment().format("DD/MM/YYYY")); // Set a valid date format
  const { impressionList, isLoading } = useSelector((state: RootStore) => state.host);
  const [countryOptions, setCountryOptions] = useState<any[]>([]); // All countries
  const [selectedCountry, setSelectedCountry] = useState<any>(null); // Selected country

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [language, setLanguage] = useState("");
  const [imagePath, setImagePath] = useState<string>();
  const [impression, setImpression] = useState<string[]>([]);
  const [videoPath, setVideoPath] = useState<any>(null);
  const [thumbnail, setThumbnail] = useState<File[]>([]);
  const [thumbnailKey, setThumbnailKey] = useState<number>(0);
  const [image, setImage] = useState();
  const [gender, setGender] = useState("");
  const [bio, setBio] = useState("");
  const [loadingCountries, setLoadingCountries] = useState(false);

  const [privateCallRate, setPrivateCallRate] = useState(0);
  const [randomCallFemaleRate, setRandomCallFemaleRate] = useState(0);
  const [randomCallMaleRate, setRandomCallMaleRate] = useState(0);
  const [randomCallRate, setRandomCallRate] = useState(0);

  const [images, setImages] = useState<any[]>([]);
  const [videocall, setVideocall] = useState<any[]>([]);
  const [videolive, setVideolive] = useState<any[]>([]);
  const [profilevideo, setProfilevideo] = useState<any[]>([]);

  // ✅ Enhanced file operations tracking
  const [fileOperations, setFileOperations] = useState<FileOperations>({
    add: {
      images: [],
      videocall: [],
      videolive: [],
      profilevideo: []
    },
    remove: {
      images: [], // indices to remove
      videocall: [],
      videolive: [],
      profilevideo: []
    }
  });

  // Original data for comparison
  const [originalFiles, setOriginalFiles] = useState({
    images: [],
    videocall: [],
    videolive: [],
    profilevideo: []
  });

  const [originalData, setOriginalData] = useState({
    name: "",
    email: "",
    dob: "",
    language: "",
    impression: [],
    bio: "",
    gender: "",
    country: "",
    countryFlagImage: "",
    privateCallRate: 0,
    randomCallFemaleRate: 0,
    randomCallMaleRate: 0,
    randomCallRate: 0,
    image: ""
  });

  const { dialogue, dialogueData } = useSelector(
    (state: RootStore) => state.dialogue
  );

  const findOriginalIndex = (fileToFind: any, originalArray: any[]) => {
    return originalArray.findIndex(originalFile => {
      const originalUrl = typeof originalFile === 'string' ? originalFile : originalFile.url;
      const searchUrl = typeof fileToFind === 'string' ? fileToFind : fileToFind.url;
      return originalUrl === searchUrl;
    });
  };

  useEffect(() => {
    if (dialogueData?.dob) {
      const parsedDate = moment(dialogueData.dob, "DD/MM/YYYY", true); // strict parsing
      if (parsedDate.isValid()) {
        setStartDate(parsedDate.format("DD/MM/YYYY"));
      } else {
        setStartDate("");
      }
    }
  }, [dialogueData]);


  console.log('dialogueData: ', dialogueData);
  useEffect(() => {
    if (dialogueData) {
      setOriginalFiles({
        images: dialogueData?.photoGallery || [],
        videocall: dialogueData?.video || [],
        videolive: dialogueData?.liveVideo || [],
        profilevideo: dialogueData?.profileVideo || []
      });

      setOriginalData({
        name: dialogueData.name || "",
        email: dialogueData.email || "",
        dob: dialogueData.dob || "",
        language: dialogueData.language || "",
        impression: dialogueData.impression || [],
        bio: dialogueData.bio || "",
        gender: dialogueData.gender || "",
        country: dialogueData.country || "",
        countryFlagImage: dialogueData.countryFlagImage || "",
        privateCallRate: dialogueData.privateCallRate || 0,
        randomCallFemaleRate: dialogueData.randomCallFemaleRate || 0,
        randomCallMaleRate: dialogueData.randomCallMaleRate || 0,
        randomCallRate: dialogueData.randomCallRate || 0,
        image: dialogueData.image || ""
      });

      setFileOperations({
        add: { images: [], videocall: [], videolive: [], profilevideo: [] },
        remove: { images: [], videocall: [], videolive: [], profilevideo: [] },
      });
    }
  }, [dialogueData]);

  useEffect(() => {
    if (dialogueData) {
      setPrivateCallRate(dialogueData?.privateCallRate);
      setRandomCallFemaleRate(dialogueData?.randomCallFemaleRate);
      setRandomCallMaleRate(dialogueData?.randomCallMaleRate);
      setRandomCallRate(dialogueData?.randomCallRate);
      setEmail(dialogueData?.email);
      setGender(dialogueData?.gender);
      setBio(dialogueData?.bio);
      setImagePath(baseURL + dialogueData?.image);
      setImages(dialogueData?.photoGallery?.map((item: any) => item));

      setVideocall(dialogueData?.video?.map((item: any) => item));
      setVideolive(dialogueData?.liveVideo?.map((item: any) => item));
      setProfilevideo(dialogueData?.profileVideo?.map((item: any) => item));

      setLanguage(dialogueData?.language);
      setVideoPath(baseURL + dialogueData?.video);

      let impressionArray: string[] = [];
      if (Array.isArray(dialogueData?.impression)) {
        impressionArray = dialogueData.impression.flatMap((item: string) =>
          item.split(",").map((name) => name.trim())
        );
      } else if (typeof dialogueData?.impression === "string") {
        impressionArray = dialogueData.impression
          .split(",")
          .map((name: any) => name.trim());
      }
      const matchImpressionNames = impressionList?.map((item: any) =>
        item?.name?.trim()
      );
      const matchedNames = matchImpressionNames?.filter((name: string) =>
        impressionArray.includes(name)
      );
      setImpression(matchedNames || []);
    }
  }, [dialogueData, impressionList]);

  useEffect(() => {
    const processCountries = () => {
      setLoadingCountries(true);

      try {
        // Transform countries to React Select format
        const transformedCountries = countriesData
          .filter(
            (country) =>
              country.name?.common && country.cca2 && country.flags?.png
          )
          .map((country) => ({
            value: country.cca2, // Required by React Select
            label: country.name.common, // Required by React Select
            name: country.name.common,
            code: country.cca2,
            flagUrl: country.flags.png || country.flags.svg,
            flag: country.flags.png || country.flags.svg, // For compatibility
          }))
          .sort((a, b) => a.label.localeCompare(b.label));

        setCountryOptions(transformedCountries);

        // Set default or existing country
        if (dialogueData?.country) {
          const existingCountry = transformedCountries.find(
            (c: any) =>
              c.name.toLowerCase() === dialogueData.country.toLowerCase()
          );
          setSelectedCountry(existingCountry || null);
        } else {
          // Set India as default
          const defaultCountry = transformedCountries.find(
            (c: any) => c.name === "India"
          );
          setSelectedCountry(defaultCountry || transformedCountries[0] || null);
        }
      } catch (error) {
        console.error("Failed to process countries:", error);
      } finally {
        setLoadingCountries(false);
      }
    };

    processCountries();
  }, [dialogueData]);

  useEffect(() => {
    dispatch(getImpression());
  }, []);

  useEffect(() => {
    setName(dialogueData?.name);
  }, [dialogueData]);

  const dispatch = useAppDispatch();

  const [error, setError] = useState<ErrorState>({
    name: "",
    email: "",
    Dob: "",
    language: "",
    country: "",
    image: "",
    impression: "",
    gender: "",
    bio: "",
    images: "",
    video: "",
    videocall: "",
    videolive: "",
    profilevideo: "",
    countryFlagImage: "",
    privateCallRate: "",
    randomCallFemaleRate: "",
    randomCallMaleRate: "",
    randomCallRate: ""
  });

  const CustomOption = ({ innerRef, innerProps, data }: any) => (
    <div
      ref={innerRef}
      {...innerProps}
      className="optionShow-option p-2 d-flex align-items-center"
    >
      <img
        height={24}
        width={32}
        alt={data.name}
        src={data.flagUrl}
        className="me-2"
        style={{ objectFit: "cover" }}
      />
      <span>{data.label}</span>
    </div>
  );

  const handleSubmit = async (e: any) => {

    e.preventDefault();

    if (
      !name ||
      !email ||
      !startDate ||
      !language ||
      !impression ||
      !gender ||
      !bio ||
      !imagePath ||
      images?.length === 0 ||
      videocall?.length === 0 ||
      videolive?.length === 0 ||
      profilevideo?.length === 0
    ) {
      let error = {} as ErrorState;
      if (!name) error.name = "Name is Required!";
      if (!email) error.email = "Email is Required!";
      if (!email.includes("@")) error.email = "Email must include '@'";
      if (!startDate) error.Dob = "Dob is Required!";
      if (!language) error.language = "Language is Required!";
      if (!impression) error.impression = "Impression is Required!";
      if (!gender) error.gender = "Gender is Required!";
      if (!bio) error.bio = "Bio is Required!";
      if (!imagePath) error.image = "Image is Required!";
      if (images?.length === 0) error.images = "Photo Gallery is Required!";
      if (videocall?.length === 0) error.videocall = "Video call is Required!";
      if (videolive?.length === 0)
        error.videolive = "Live Video call is Required!";
      if (profilevideo?.length === 0) error.profilevideo = "Profile Video is Required!";

      return setError({ ...error });
    }

    const formData: any = new FormData();

    const maybeAppend = (key: string, newValue: any, origValue: any) => {
      if (newValue !== origValue && newValue !== undefined && newValue !== null && newValue !== '') {
        formData.append(key, newValue ?? "");
      }
    };

    if (dialogueData) {
      formData.append("hostId", dialogueData._id);
      maybeAppend("name", name, originalData.name);
      maybeAppend("email", email, originalData.email);
      maybeAppend("dob", startDate, originalData.dob);
      maybeAppend("language", language, originalData.language);
      if (JSON.stringify(impression) !== JSON.stringify(originalData.impression)) {
        formData.append("impression", impression?.join(",") || "");
      }
      maybeAppend("bio", bio, originalData.bio);
      maybeAppend("gender", gender, originalData.gender);
      if (selectedCountry?.name && selectedCountry.name.toLowerCase() !== originalData.country.toLowerCase()) {
        formData.append("country", selectedCountry.name);
      }

      if (selectedCountry?.flag && selectedCountry.flag !== originalData.countryFlagImage) {
        formData.append("countryFlagImage", selectedCountry.flag);
      }
      maybeAppend("privateCallRate", privateCallRate, originalData.privateCallRate);
      maybeAppend("randomCallFemaleRate", randomCallFemaleRate, originalData.randomCallFemaleRate);
      maybeAppend("randomCallMaleRate", randomCallMaleRate, originalData.randomCallMaleRate);
      maybeAppend("randomCallRate", randomCallRate, originalData.randomCallRate);

      if (image && imagePath !== (baseURL + originalData.image)) {
        formData.append("image", image);
      }

      // -- Payload: add and remove for images etc
      fileOperations.add.images.forEach(f => formData.append("photoGallery", f));
      fileOperations.add.videocall.forEach(f => formData.append("video", f));
      fileOperations.add.videolive.forEach(f => formData.append("liveVideo", f));
      fileOperations.add.profilevideo.forEach(f => formData.append("profileVideo", f));

      if (fileOperations.remove.images.length > 0) formData.append("removePhotoGalleryIndex", JSON.stringify(fileOperations.remove.images));
      if (fileOperations.remove.videocall.length > 0) formData.append("removeVideoIndexes", JSON.stringify(fileOperations.remove.videocall));
      if (fileOperations.remove.videolive.length > 0) formData.append("removeLiveVideoIndex", JSON.stringify(fileOperations.remove.videolive));
      if (fileOperations.remove.profilevideo.length > 0) formData.append("removeProfileVideoIndex", JSON.stringify(fileOperations.remove.profilevideo));

      await dispatch(updateHost(formData));
    } else {
      // Always include all fields when creating
      formData.append("name", name || "");
      formData.append("email", email || "");
      const parsedDate = moment(startDate, "DD/MM/YYYY", true); // strict parsing

      if (parsedDate.isValid()) {
        formData.append("dob", parsedDate.format("DD/MM/YYYY"));
      } else {
        console.warn("Invalid DOB, not appending to formData:", startDate);
        // Optionally show error or skip appending
      }

      formData.append("language", language);
      formData.append("impression", impression?.join(",") || "");
      formData.append("image", image);
      formData.append("country", selectedCountry?.name);
      formData.append("countryFlagImage", selectedCountry?.flag);
      formData.append("bio", bio);
      formData.append("gender", gender);

      for (let i = 0; i < images.length; i++) {
        if (images[i] instanceof File) {
          formData.append("photoGallery", images[i]);
        }
      }
      for (let i = 0; i < videocall.length; i++) {
        if (videocall[i] instanceof File) {
          formData.append("video", videocall[i]);
        }
      }
      for (let i = 0; i < videolive.length; i++) {
        if (videolive[i] instanceof File) {
          formData.append("liveVideo", videolive[i]);
        }
      }
      for (let i = 0; i < profilevideo.length; i++) {
        if (profilevideo[i] instanceof File) {
          formData.append("profileVideo", profilevideo[i]);
        }
      }
      await dispatch(createHost(formData));
    }

    dispatch(closeDialog());
  };

  const handleSelectChange = (selected: any | null) => {
    setSelectedCountry(selected);

    if (!selected) {
      return setError({
        ...error,
        country: `Country Is Required`,
      });
    } else {
      return setError({
        ...error,
        country: "",
      });
    }
  };

  const handleInputImage = (e: any) => {
    if (e.target.files) {
      setImage(e?.target?.files[0]);
      setImagePath(URL.createObjectURL(e.target.files[0]));
      setError({ ...error, image: "" });
    }
  };

  const onPreviewDrop = (acceptedFiles: FileWithPath[]) => {
    const validImages = acceptedFiles.filter((file) =>
      file.type.startsWith("image/")
    );

    if (validImages.length !== acceptedFiles.length) {
      alert("Only image files are allowed!");
      return;
    }
    setImages(prev => [...prev, ...acceptedFiles]);
    setFileOperations(prev => ({
      ...prev,
      add: {
        ...prev.add,
        images: [...prev.add.images, ...acceptedFiles]
      }
    }));
    setError(prev => ({ ...prev, images: "" }));
  };

  const onPreviewDropVideo = (acceptedFiles: FileWithPath[]) => {
    const validImages = acceptedFiles.filter((file) =>
      file.type.startsWith("video/")
    );

    if (validImages.length !== acceptedFiles.length) {
      alert("Only Video files are allowed!");
      return;
    }

    setVideocall(prev => [...prev, ...acceptedFiles]);
    setFileOperations(prev => ({
      ...prev,
      add: {
        ...prev.add,
        videocall: [...prev.add.videocall, ...acceptedFiles]
      }
    }));
    setError(prev => ({ ...prev, videolive: "" }));
  };

  const onPreviewDropVideoLive = (acceptedFiles: FileWithPath[]) => {
    const validImages = acceptedFiles.filter((file) =>
      file.type.startsWith("video/")
    );

    if (validImages.length !== acceptedFiles.length) {
      alert("Only Video files are allowed!");
      return;
    }
    setVideolive(prev => [...prev, ...acceptedFiles]);
    setFileOperations(prev => ({
      ...prev,
      add: {
        ...prev.add,
        videolive: [...prev.add.videolive, ...acceptedFiles]
      }
    }));
    setError(prev => ({ ...prev, videolive: "" }));
  };

  const onPreviewDropProfileVideo = (acceptedFiles: FileWithPath[]) => {
    const validVideos = acceptedFiles.filter((file) => file.type.startsWith("video/"));
    if (validVideos.length !== acceptedFiles.length) {
      alert("Only Video files are allowed!");
      return;
    }
    setProfilevideo(prev => [...prev, ...acceptedFiles]);
    setFileOperations(prev => ({
      ...prev,
      add: {
        ...prev.add,
        profilevideo: [...prev.add.profilevideo, ...acceptedFiles]
      }
    }));
    setError(prev => ({ ...prev, profilevideo: "" }));
  };

  const removeProfileVideo = (file: File | string, displayIndex: number) => {

    setProfilevideo(prev => prev.filter((_, idx) => idx !== displayIndex));

    if (file instanceof File) {
      const isInAdd = fileOperations.add.profilevideo.includes(file);
      if (isInAdd) {
        setFileOperations(prev => ({
          ...prev,
          add: {
            ...prev.add,
            profilevideo: prev.add.profilevideo.filter(f => f !== file)
          }
        }));
      }
    } else {
      const originalIndex = findOriginalIndex(file, originalFiles.profilevideo);
      if (originalIndex !== -1) {
        setFileOperations(prev => ({
          ...prev,
          remove: {
            ...prev.remove,
            profilevideo: [...prev.remove.profilevideo, originalIndex]
          }
        }));
      }
    }
  };


  const removeImage = (file: File | string, displayIndex: number) => {

    setImages(prev => prev.filter((_, idx) => idx !== displayIndex));

    if (file instanceof File) {
      const isInAdd = fileOperations.add.images.includes(file);
      if (isInAdd) {
        setFileOperations(prev => ({
          ...prev,
          add: {
            ...prev.add,
            images: prev.add.images.filter(f => f !== file)
          }
        }));
      }
    } else {
      const originalIndex = findOriginalIndex(file, originalFiles.images);
      if (originalIndex !== -1) {
        setFileOperations(prev => ({
          ...prev,
          remove: {
            ...prev.remove,
            images: [...prev.remove.images, originalIndex]
          }
        }));
      }
    }
  };
  const removeVideo = (file: File | string, displayIndex: number) => {

    setVideocall(prev => prev.filter((_, idx) => idx !== displayIndex));

    if (file instanceof File) {
      const isInAdd = fileOperations.add.videocall.includes(file);
      if (isInAdd) {
        setFileOperations(prev => ({
          ...prev,
          add: {
            ...prev.add,
            videocall: prev.add.videocall.filter(f => f !== file)
          }
        }));
      }
    } else {
      const originalIndex = findOriginalIndex(file, originalFiles.videocall);
      if (originalIndex !== -1) {
        setFileOperations(prev => ({
          ...prev,
          remove: {
            ...prev.remove,
            videocall: [...prev.remove.videocall, originalIndex]
          }
        }));
      }
    }
  };
  const removeVideoLive = (file: File | string, displayIndex: number) => {

    setVideolive(prev => prev.filter((_, idx) => idx !== displayIndex));

    if (file instanceof File) {
      const isInAdd = fileOperations.add.videolive.includes(file);
      if (isInAdd) {
        setFileOperations(prev => ({
          ...prev,
          add: {
            ...prev.add,
            videolive: prev.add.videolive.filter(f => f !== file)
          }
        }));
      }
    } else {
      const originalIndex = findOriginalIndex(file, originalFiles.videolive);
      if (originalIndex !== -1) {
        setFileOperations(prev => ({
          ...prev,
          remove: {
            ...prev.remove,
            videolive: [...prev.remove.videolive, originalIndex]
          }
        }));
      }
    }
  };

  const impressionOptions = impressionList.map((item: any) => ({
    label: item.name,
    value: item.name, // or item.id if you prefer
  }));

  const handleVideo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file: any = e.target.files?.[0];
    setVideoPath(URL.createObjectURL(file));

    if (file) {
      const thumbnailBlob: any = await generateThumbnailBlob(file);

      if (thumbnailBlob) {
        const videoFileName = file ? file?.name : "video";
        const thumbnailFileName = `${videoFileName.replace(
          /\.[^/.]+$/,
          ""
        )}.jpeg`;

        const thumbnailFile = new File([thumbnailBlob], thumbnailFileName, {
          type: "image/jpeg",
        });
        setThumbnail([thumbnailFile]);
        // setVideo({
        //   file: file,
        //   thumbnailBlob: thumbnailFile,
        // });
      }
      setThumbnailKey((prevKey) => prevKey + 1);
    } else {
    }
    const selectedFile = e.target.files?.[0];

    const videoElement = document.createElement("video");
    if (selectedFile) {
      videoElement.src = URL.createObjectURL(selectedFile);
      videoElement.addEventListener("loadedmetadata", () => {
        const durationInSeconds = videoElement.duration;
      });
    }
  };

  const generateThumbnailBlob = async (file: File) => {
    return new Promise((resolve) => {
      const video = document.createElement("video");
      video.preload = "metadata";

      video.onloadedmetadata = () => {
        video.currentTime = 1; // Set to capture the frame at 1 second
      };

      video.onseeked = async () => {
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Convert the canvas to blob
        canvas.toBlob((blob) => {
          resolve(blob);
        }, "image/jpeg");
      };

      const objectURL = URL.createObjectURL(file);
      video.src = objectURL;

      return () => {
        URL.revokeObjectURL(objectURL);
      };
    });
  };


  return (
    <>
      <div className="dialog">
        <div style={{ width: "1800px" }}>
          <div className="row justify-content-center">
            <div className="col-xl-5 col-md-8 col-11">
              <div className="mainDiaogBox" style={{ width: "700px" }}>
                <div className="row justify-content-between align-items-center formHead">
                  <div className="col-8">
                    <h2 className="text-theme fs-26 m0">Host</h2>
                  </div>

                  <div className="col-4">
                    <div
                      className="closeButton"
                      onClick={() => {
                        dispatch(closeDialog());
                      }}
                      style={{ fontSize: "20px" }}
                    >
                      ✖
                    </div>
                  </div>
                </div>

                <div className="row  formFooter mt-3">
                  <div className="col-6">
                    <ExInput
                      type="text"
                      id="name"
                      name="name"
                      value={name}
                      label="Name"
                      placeholder="Name"
                      errorMessage={error && error.name}
                      onChange={(e: any) => {
                        setName(e.target.value);
                        if (!e.target.value) {
                          return setError({
                            ...error,
                            name: "Name is required",
                          });
                        } else {
                          return setError({
                            ...error,
                            name: "",
                          });
                        }
                      }}
                    />
                  </div>
                  <div className="col-6">
                    <ExInput
                      type="text"
                      id="email"
                      name="email"
                      value={email}
                      label="Email"
                      placeholder="Email"
                      errorMessage={error && error.email}
                      onChange={(e: any) => {
                        const value = e.target.value;

                        setEmail(value);
                        if (!value) {
                          return setError({
                            ...error,
                            email: "Email is required",
                          });
                        } else if (!value.includes("@")) {
                          return setError({
                            ...error,
                            email: "Email must include '@'",
                          });
                        } else {
                          return setError({
                            ...error,
                            email: "",
                          });
                        }
                      }}
                    />
                  </div>
                  <div className="col-6">
                    <label>Dob</label>
                    <br></br>
                    <DatePicker
                      selected={
                        startDate
                          ? moment(startDate, "DD/MM/YYYY").toDate()
                          : null
                      }
                      onChange={(date: Date) => {
                        const formatted = moment(date).format("DD/MM/YYYY");
                        setStartDate(formatted);
                      }}
                      dateFormat="dd/MM/yyyy"
                    />
                  </div>
                  <div className="col-6">
                    <div className="inputData">
                      <label className="  " htmlFor="category">
                        Gender
                      </label>
                      <select
                        name="category"
                        className="rounded-2"
                        id="category"
                        value={gender}
                        onChange={(e) => {
                          setGender(e.target.value);
                          setError((prev: typeof error) => ({
                            ...prev,
                            gender: e.target.value ? "" : "Gender is required",
                          }));
                        }}
                      >
                        <option value="">--Select Gender--</option>
                        {genderData?.map((data) => (
                          <option key={data.value} value={data.value}>
                            {data.label}
                          </option>
                        ))}
                      </select>

                      {error?.gender && (
                        <p className="errorMessage text-start">
                          {error && error?.gender}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="col-6">
                    <ExInput
                      type="text"
                      id="language"
                      name="language"
                      value={language}
                      label="Language"
                      placeholder="Language"
                      errorMessage={error && error.language}
                      onChange={(e: any) => {
                        setLanguage(e.target.value);
                        if (!e.target.value) {
                          return setError({
                            ...error,
                            language: "Language is required",
                          });
                        } else {
                          return setError({
                            ...error,
                            language: "",
                          });
                        }
                      }}
                    />
                  </div>
                  <div className="col-6 col-sm-12 col-md-12 col-lg-6">
                    <div className="custom-input">
                      <label className="">Country</label>
                      <ReactSelect
                        options={countryOptions} // FIXED: Use options array
                        value={selectedCountry} // FIXED: Use selected country
                        isClearable={true}
                        isLoading={loadingCountries}
                        placeholder="Select a country..."
                        onChange={handleSelectChange}
                        className="mt-2"
                        classNamePrefix="react-select"
                        formatOptionLabel={(option) => (
                          <div className="d-flex align-items-center">
                            <img
                              height={20}
                              width={28}
                              alt={option.name}
                              src={option.flagUrl}
                              className="me-2"
                              style={{ objectFit: "cover" }}
                              onError={(e: any) => {
                                e.target.style.display = "none";
                              }}
                            />
                            <span>{option.label}</span>
                          </div>
                        )}
                        components={{
                          Option: CustomOption,
                        }}
                        styles={{
                          option: (provided, state) => ({
                            ...provided,
                            cursor: "pointer",
                            "&:hover": {
                              backgroundColor: "#f8f9fa",
                            },
                          }),
                        }}
                      />
                    </div>
                  </div>
                  <div className="col-6">
                    <label className="mt-3" htmlFor="impression">
                      Impression
                    </label>
                    <div style={{ marginTop: "10px" }}>
                      <Select
                        isMulti
                        options={impressionOptions}
                        value={impressionOptions.filter((option: any) =>
                          impression?.includes(option.label)
                        )}
                        onChange={(selectedOptions: any) => {
                          const selectedLabels = selectedOptions.map(
                            (option: any) => option.label
                          );
                          setImpression(selectedLabels);
                          setError((prev: typeof error) => ({
                            ...prev,
                            impression:
                              selectedLabels.length > 0
                                ? ""
                                : "Impression is required",
                          }));
                        }}
                        placeholder="--Select Impression--"
                        styles={{
                          menu: (base) => ({
                            ...base,
                            backgroundColor: "white",
                            color: "black",
                            zIndex: 9999,
                          }),
                          menuList: (base) => ({
                            ...base,
                            maxHeight: "150px",
                            overflowY: "auto",
                          }),
                          option: (base, state) => ({
                            ...base,
                            backgroundColor: state.isFocused
                              ? "#f0f0f0"
                              : "white",
                            color: "black",
                            cursor: "pointer",
                          }),
                          control: (base, state) => ({
                            ...base,
                            borderColor: state.isFocused
                              ? "#86b7fe"
                              : "#ced4da",
                            boxShadow: state.isFocused
                              ? "0 0 0 0.2rem rgba(13,110,253,.25)"
                              : "none",
                            "&:hover": {
                              borderColor: "#86b7fe",
                            },
                          }),
                          multiValue: (base) => ({
                            ...base,
                            backgroundColor: "#e7e7e7",
                          }),
                          multiValueLabel: (base) => ({
                            ...base,
                            color: "black",
                          }),
                        }}
                      />
                    </div>

                    {error?.impression && (
                      <p className="text-danger text-start">
                        {error && error?.impression}
                      </p>
                    )}
                  </div>
                  <div className="col-6 mt-2">
                    <Textarea
                      row={3}
                      type={`text`}
                      id={`bio`}
                      name={`bio`}
                      value={bio}
                      defaultValue={bio && bio}
                      label={`Bio`}
                      placeholder={`Bio`}
                      errorMessage={error.bio && error.bio}
                      onChange={(e: any) => {
                        setBio(e.target.value);
                        if (!e.target.value) {
                          return setError({
                            ...error,
                            bio: `Bio is required`,
                          });
                        } else {
                          return setError({
                            ...error,
                            bio: "",
                          });
                        }
                      }}
                    />
                  </div>
                  <div className="mt-2 col-6">
                    <ExInput
                      id="image"
                      name="image"
                      type={"file"}
                      label={"Image"}
                      accept={"image/png, image/jpeg"}
                      errorMessage={error.image && error.image}
                      onChange={handleInputImage}
                    />
                  </div>
                  <div className="col-6 mt-2 fake-create-img mb-2">
                    {imagePath && (
                      <>
                        <img
                          src={imagePath ? imagePath : dialogueData?.image}
                          className="mt-3 rounded float-left mb-2"
                          alt="image"
                          style={{ width: "100px", height: "100px" }}
                        />
                      </>
                    )}
                  </div>
                  <div className="col-6">
                    <ExInput
                      type="number"
                      id="privateCallRate"
                      name="privateCallRate"
                      value={privateCallRate}
                      label="Private Call Rate"
                      placeholder="Private Call Rate"
                      errorMessage={error && error.privateCallRate}
                      onChange={(e: any) => {
                        setPrivateCallRate(e.target.value);
                        if (!e.target.value) {
                          return setError({
                            ...error,
                            privateCallRate: "Private Call Rate is required",
                          });
                        } else {
                          return setError({
                            ...error,
                            privateCallRate: "",
                          });
                        }
                      }}
                    />
                  </div>
                  <div className="col-6">
                    <ExInput
                      type="number"
                      id="randomCallFemaleRate"
                      name="randomCallFemaleRate"
                      value={randomCallFemaleRate}
                      label="Random Female Call Rate"
                      placeholder="Random Female Call Rate"
                      errorMessage={error && error.randomCallFemaleRate}
                      onChange={(e: any) => {
                        setRandomCallFemaleRate(e.target.value);
                        if (!e.target.value) {
                          return setError({
                            ...error,
                            randomCallFemaleRate: "Random Female Call Rate is required",
                          });
                        } else {
                          return setError({
                            ...error,
                            randomCallFemaleRate: "",
                          });
                        }
                      }}
                    />
                  </div>

                  <div className="col-6">
                    <ExInput
                      type="number"
                      id="randomCallMaleRate"
                      name="randomCallMaleRate"
                      value={randomCallMaleRate}
                      label="Random Male Call Rate"
                      placeholder="Random Male Call Rate"
                      errorMessage={error && error.randomCallMaleRate}
                      onChange={(e: any) => {
                        setRandomCallMaleRate(e.target.value);
                        if (!e.target.value) {
                          return setError({
                            ...error,
                            randomCallMaleRate: "Random Male Call Rate is required",
                          });
                        } else {
                          return setError({
                            ...error,
                            randomCallMaleRate: "",
                          });
                        }
                      }}
                    />
                  </div>
                  <div className="col-6">
                    <ExInput
                      type="number"
                      id="randomCallRate"
                      name="randomCallRate"
                      value={randomCallRate}
                      label="Random Call Rate"
                      placeholder="Random Call Rate"
                      errorMessage={error && error.randomCallRate}
                      onChange={(e: any) => {
                        setRandomCallRate(e.target.value);
                        if (!e.target.value) {
                          return setError({
                            ...error,
                            randomCallRate: "Random Call Rate is required",
                          });
                        } else {
                          return setError({
                            ...error,
                            randomCallRate: "",
                          });
                        }
                      }}
                    />
                  </div>
                  <div className="col-12 mt-2 ">
                    <div className="custom-input">
                      <label>Photo Gallery</label>
                      <>
                        <ReactDropzone
                          onDrop={(acceptedFiles: FileWithPath[]) =>
                            onPreviewDrop(acceptedFiles)
                          }
                          accept={{
                            'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.bmp', '.webp', '.svg']
                          }}
                        >
                          {({ getRootProps, getInputProps }) => (
                            <section className="mt-4">
                              <div {...getRootProps()}>
                                <input {...getInputProps()} />
                                <div
                                  style={{
                                    height: "130px",
                                    width: "130px",
                                    borderRadius: "11px",
                                    border: "2px dashed rgb(185 191 199)",
                                    textAlign: "center",
                                    display: "flex",
                                    justifyContent: "center",
                                    alignItems: "center",
                                    marginTop: "10px",
                                  }}
                                >
                                  <AddIcon
                                    sx={{
                                      fontSize: "40px",
                                      color: "rgb(185 191 199)",
                                    }}
                                  />
                                </div>
                              </div>
                            </section>
                          )}
                        </ReactDropzone>

                        {error.images && (
                          <div className="ml-2 mt-1">
                            <div className="pl-1 text__left">
                              <span className="text-danger">
                                {error.images}
                              </span>
                            </div>
                          </div>
                        )}
                      </>
                    </div>
                  </div>

                  <div className="col-12 d-flex flex-wrap">
                    <div className="row image-show-multi demo"  >
                      {images?.map((file: any, index: number) => {
                        const isFile = file instanceof File;
                        return (
                          <div key={index} className="image-grid-multi">
                            <div className="image-show-multi-box">
                              {file?.url ? (
                                <img
                                  src={
                                    isFile
                                      ? URL.createObjectURL(file)
                                      : file
                                        ? baseURL + file?.url
                                        : ""
                                  }
                                  alt=""
                                  className="mt-3 ms-3 rounded float-left mb-2"
                                  height="100px"
                                  width="100px"
                                />
                              ) : (
                                <img
                                  src={
                                    isFile
                                      ? URL.createObjectURL(file)
                                      : file
                                        ? baseURL + file
                                        : ""
                                  }
                                  alt=""
                                  className="mt-3 ms-3 rounded float-left mb-2"
                                  height="100px"
                                  width="100px"
                                />
                              )}

                              <IconButton
                                onClick={() => removeImage(file, index)}
                                style={{
                                  position: "absolute",
                                  left: "69px",
                                  cursor: "pointer",
                                  background: "red",
                                  color: "white",
                                  height: "30px",
                                  width: "30px",
                                }}
                              >
                                <CloseIcon />
                              </IconButton>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="col-12 mt-2 ">
                    <div className="custom-input">
                      <label>Video</label>
                      <>
                        <ReactDropzone
                          onDrop={(acceptedFiles: FileWithPath[]) =>
                            onPreviewDropVideo(acceptedFiles)
                          }
                          accept={{
                            'video/*': []
                          }}

                        >
                          {({ getRootProps, getInputProps }) => (
                            <section className="mt-4">
                              <div {...getRootProps()}>
                                <input {...getInputProps()} />
                                <div
                                  style={{
                                    height: "130px",
                                    width: "130px",
                                    borderRadius: "11px",
                                    border: "2px dashed rgb(185 191 199)",
                                    textAlign: "center",
                                    display: "flex",
                                    justifyContent: "center",
                                    alignItems: "center",
                                    marginTop: "10px",
                                  }}
                                >
                                  <AddIcon
                                    sx={{
                                      fontSize: "40px",
                                      color: "rgb(185 191 199)",
                                    }}
                                  />
                                </div>
                              </div>
                            </section>
                          )}
                        </ReactDropzone>

                        {error.videocall && (
                          <div className="ml-2 mt-1">
                            <div className="pl-1 text__left">
                              <span className="text-danger">
                                {error.videocall}
                              </span>
                            </div>
                          </div>
                        )}
                      </>
                    </div>
                  </div>

                  <div className="col-12">
                    <div className="video-preview-container">
                      {videocall?.map((file: any, index: number) => {
                        const isFile = file instanceof File;
                        return (
                          <div key={index} className="image-grid-multi">
                            <div className="image-show-multi-box mx-1">
                              <video

                                controls={true}
                                style={{ width: "150px", height: "170px", pointerEvents: "none", objectFit: "cover" }}
                                src={
                                  isFile
                                    ? URL.createObjectURL(file)
                                    : file
                                      ? baseURL + file
                                      : ""
                                }
                              />
                              <IconButton
                                onClick={() => removeVideo(file, index)}
                                style={{
                                  position: "absolute",
                                  left: "131px",
                                  cursor: "pointer",
                                  background: "red",
                                  color: "white",
                                  height: "30px",
                                  width: "30px",
                                }}
                              >
                                <CloseIcon />
                              </IconButton>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>


                  {/* Live Video */}
                  <div className="col-12 mt-2 ">
                    <div className="custom-input">
                      <label>Live Video</label>
                      <>
                        <ReactDropzone
                          onDrop={(acceptedFiles: FileWithPath[]) =>
                            onPreviewDropVideoLive(acceptedFiles)
                          }

                          accept={{
                            'video/*': []
                          }}
                        >
                          {({ getRootProps, getInputProps }) => (
                            <section className="mt-4">
                              <div {...getRootProps()}>
                                <input {...getInputProps()} />
                                <div
                                  style={{
                                    height: "130px",
                                    width: "130px",
                                    borderRadius: "11px",
                                    border: "2px dashed rgb(185 191 199)",
                                    textAlign: "center",
                                    display: "flex",
                                    justifyContent: "center",
                                    alignItems: "center",
                                    marginTop: "10px",
                                  }}
                                >
                                  <AddIcon
                                    sx={{
                                      fontSize: "40px",
                                      color: "rgb(185 191 199)",
                                    }}
                                  />
                                </div>
                              </div>
                            </section>
                          )}
                        </ReactDropzone>

                        {error.videolive && (
                          <div className="ml-2 mt-1">
                            <div className="pl-1 text__left">
                              <span className="text-danger">
                                {error.videolive}
                              </span>
                            </div>
                          </div>
                        )}
                      </>
                    </div>
                  </div>


                  <div className="col-12">
                    <div className="video-preview-container">
                      {videolive?.map((file: any, index: number) => {
                        const isFile = file instanceof File;
                        return (
                          <div key={index} className="image-grid-multi">
                            <div className="image-show-multi-box mx-1">
                              <video

                                controls
                                style={{ width: "150px", height: "170px", pointerEvents: "none", objectFit: "cover" }}
                                src={
                                  isFile
                                    ? URL.createObjectURL(file)
                                    : file
                                      ? baseURL + file
                                      : ""
                                }
                              />
                              <IconButton
                                onClick={() => removeVideoLive(file, index)}
                                style={{
                                  position: "absolute",
                                  left: "131px",
                                  cursor: "pointer",
                                  background: "red",
                                  color: "white",
                                  height: "30px",
                                  width: "30px",
                                }}
                              >
                                <CloseIcon />
                              </IconButton>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Profile Video  */}
                  <div className="col-12 mt-2 ">
                    <div className="custom-input">
                      <label>Profile Video</label>
                      <>
                        <ReactDropzone
                          onDrop={(acceptedFiles: FileWithPath[]) => onPreviewDropProfileVideo(acceptedFiles)}
                          accept={{ 'video/*': [] }}
                        >
                          {({ getRootProps, getInputProps }) => (
                            <section className="mt-4">
                              <div {...getRootProps()}>
                                <input {...getInputProps()} />
                                <div
                                  style={{
                                    height: "130px",
                                    width: "130px",
                                    borderRadius: "11px",
                                    border: "2px dashed rgb(185 191 199)",
                                    textAlign: "center",
                                    display: "flex",
                                    justifyContent: "center",
                                    alignItems: "center",
                                    marginTop: "10px",
                                  }}
                                >
                                  <AddIcon sx={{ fontSize: "40px", color: "rgb(185 191 199)" }} />
                                </div>
                              </div>
                            </section>
                          )}
                        </ReactDropzone>

                        {error.profilevideo && (
                          <div className="ml-2 mt-1">
                            <div className="pl-1 text__left">
                              <span className="text-danger">{error.profilevideo}</span>
                            </div>
                          </div>
                        )}
                      </>
                    </div>
                  </div>

                  <div className="col-12">
                    <div className="video-preview-container">
                      {profilevideo?.map((file: any, index: number) => {
                        const isFile = file instanceof File;
                        return (
                          <div key={index} className="image-grid-multi">
                            <div className="image-show-multi-box mx-1">
                              <video

                                controls
                                style={{ width: "150px", height: "170px", pointerEvents: "none", objectFit: "cover" }}
                                src={
                                  isFile
                                    ? URL.createObjectURL(file)
                                    : file?.url
                                      ? baseURL + file.url
                                      : file
                                        ? baseURL + file
                                        : ""
                                }
                              />
                              <IconButton
                                onClick={() => removeProfileVideo(file, index)}
                                style={{
                                  position: "absolute",
                                  left: "131px",
                                  cursor: "pointer",
                                  background: "red",
                                  color: "white",
                                  height: "30px",
                                  width: "30px",
                                }}
                              >
                                <CloseIcon />
                              </IconButton>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="col-12 text-end m0">
                    <Button
                      className={`cancelButton text-white`}
                      text={`Cancel`}
                      type={`button`}
                      onClick={() => dispatch(closeDialog())}
                    />
                    <Button
                      type={`submit`}
                      className={` text-white m10-left submitButton `}
                      style={{ opacity: isLoading ? 0.7 : 1 }}
                      // style={{ backgroundColor: "#1ebc1e" }}
                      text={isLoading ? "Loading... " : "Submit"}
                      disabled={isLoading}
                      onClick={(e: any) => handleSubmit(e)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div >
    </>
  );
};

export default HostDialog;
