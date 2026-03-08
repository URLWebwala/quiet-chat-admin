// Storage Setting
export const digitalOceanContent = [
    {
        label: "Endpoint",
        description: "Tells your app where to connect to your Space for uploads/downloads.",
    },
    {
        label: "Host Name",
        description: "Defines the base URL for serving files from your Space region.",
    },
    {
        label: "Secret Key",
        description: "Secures access to your files. Keep this private.",
    },
    {
        label: "Access Key",
        description: "Works with Secret Key to authenticate file requests.",
    },
    {
        label: "Bucket Name",
        description: "Specifies which Space stores your uploaded files.",
    },
    {
        label: "Region",
        description: "Decides the data center (e.g., blr1) — affects speed and latency.",
    },
];

export const awsContent = [
    {
        label: "Endpoint",
        description: "Connects your app to AWS S3 for file storage.",
    },
    {
        label: "Host Name",
        description: "Used to generate URLs for accessing stored files.",
    },
    {
        label: "Access Key",
        description: "Identifies your AWS account when making storage requests.",
    },
    {
        label: "Secret Key",
        description: "Secures those requests. Keep this hidden.",
    },
    {
        label: "Bucket Name",
        description: "Defines which S3 bucket your files are stored in.",
    },
    {
        label: "Region",
        description: "Specifies bucket’s location (e.g., ap-south-1). Impacts latency & costs.",
    },
];

export const agoracontent = [
  {
    label: "App ID",
    description: (
      <>
        Unique identifier for your Agora project.{" "}
        <a
          href="https://console.agora.io/projects"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "#0d6efd", textDecoration: "underline" }}
        >
          Get it from Agora Console
        </a>
        .
      </>
    ),
  },
  {
    label: "App Certificate",
    description: (
      <>
        Private key used to generate tokens for secure authentication.{" "}
        <a
          href="https://console.agora.io/projects"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "#0d6efd", textDecoration: "underline" }}
        >
          View it in Agora Console
        </a>
        . Keep it confidential and do not expose it publicly.
      </>
    ),
  },
  
];


export const storageOptionContent = [
    {
        label: "Local",
        description: "Stores files on your own server. Easy setup but limited space.",
    },
    {
        label: "AWS S3",
        description: "Scalable storage from Amazon. Best for large-scale apps.",
    },
    {
        label: "DigitalOcean Space",
        description: "Affordable S3-compatible storage. Good for small to medium apps.",
    },
];


// Payment Setting 
export const razorpayContent = [
    {
        label: "Razorpay",
        description: "Toggle to enable or disable Razorpay as a payment method.",
    },
    {
        label: "Razorpay Id",
        description: (
            <>
                Public Key ID for Razorpay integration.{" "}
                <a
                    href="https://dashboard.razorpay.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: "#0d6efd", textDecoration: "underline" }}
                >
                    Get it from Razorpay Dashboard
                </a>
            </>
        ),
    },
    {
        label: "Razorpay Secret Key",
        description: (
            <>
                Secret API key paired with the Key ID for secure transactions.{" "}
                <a
                    href="https://dashboard.razorpay.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: "#0d6efd", textDecoration: "underline" }}
                >
                    Manage it in Razorpay Dashboard
                </a>
            </>
        ),
    },
];

export const stripeContent = [
    {
        label: "Stripe",
        description: "Toggle to enable or disable Stripe as a payment method.",
    },
    {
        label: "Stripe Publishable Key",
        description: (
            <>
                Public API key for Stripe payments. Required for client-side requests.{" "}
                <a
                    href="https://dashboard.stripe.com/apikeys"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: "#0d6efd", textDecoration: "underline" }}
                >
                    Get it from Stripe Dashboard
                </a>
            </>
        ),
    },
    {
        label: "Stripe Secret Key",
        description: (
            <>
                Secret API key for server-side requests. Keep this key private.{" "}
                <a
                    href="https://dashboard.stripe.com/apikeys"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: "#0d6efd", textDecoration: "underline" }}
                >
                    Manage it in Stripe Dashboard
                </a>
            </>
        ),
    },
];

export const paystackContent = [
    {
        label: "Paystack",
        description: "Toggle to enable or disable Paystack as a payment method.",
    },
    {
        label: "Paystack Public Key",
        description: (
            <>
                Public API key for Paystack payments. Required for client-side integration.{" "}
                <a
                    href="https://dashboard.paystack.com/#/settings/developer"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: "#0d6efd", textDecoration: "underline" }}
                >
                    Get it from Paystack Dashboard
                </a>
            </>
        ),
    },
    {
        label: "Paystack Secret Key",
        description: (
            <>
                Secret API key for server-side payment requests. Keep this key secure and never expose it publicly.{" "}
                <a
                    href="https://dashboard.paystack.com/#/settings/developer"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: "#0d6efd", textDecoration: "underline" }}
                >
                    Manage it in Paystack Dashboard
                </a>
            </>
        ),
    },
];

export const cashfreeContent = [
    {
        label: "Cashfree",
        description: "Toggle to enable or disable Cashfree as a payment method.",
    },
    {
        label: "Cashfree Client ID",
        description: (
            <>
                Unique Client ID used for Cashfree payment integration. Required for authentication and client-side requests.{" "}
                <a
                    href="https://merchant.cashfree.com/merchant/settings/api-keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: "#0d6efd", textDecoration: "underline" }}
                >
                    Get it from Cashfree Dashboard
                </a>
            </>
        ),
    },
    {
        label: "Cashfree Secret Key",
        description: (
            <>
                Secret Key for secure server-side Cashfree API requests. Keep this key private and do not share it publicly.{" "}
                <a
                    href="https://merchant.cashfree.com/merchant/settings/api-keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: "#0d6efd", textDecoration: "underline" }}
                >
                    Manage it in Cashfree Dashboard
                </a>
            </>
        ),
    },
];

export const paypalContent = [
    {
        label: "PayPal",
        description: "Toggle to enable or disable PayPal as a payment method.",
    },
    {
        label: "PayPal Client ID",
        description: (
            <>
                Unique Client ID used to authenticate PayPal API requests. Required for client-side integration.{" "}
                <a
                    href="https://developer.paypal.com/dashboard/applications"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: "#0d6efd", textDecoration: "underline" }}
                >
                    Get it from PayPal Developer Dashboard
                </a>
            </>
        ),
    },
    {
        label: "PayPal Secret Key",
        description: (
            <>
                Secret Key used for server-side PayPal API requests. Keep this key private and secure.{" "}
                <a
                    href="https://developer.paypal.com/dashboard/applications"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: "#0d6efd", textDecoration: "underline" }}
                >
                    Manage it in PayPal Developer Dashboard
                </a>
            </>
        ),
    },
];



export const googlePlayContent = [
    {
        label: "Google Play",
        description: (
            <>
                Toggle to enable or disable Google Play billing for in-app purchases.{" "}
                <a
                    href="https://developer.android.com/google/play/billing"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: "#0d6efd", textDecoration: "underline" }}
                >
                    Learn more at Google Play Billing Docs
                </a>
            </>
        ),
    },
];

export const flutterWaveContent = [
    {
        label: "Flutterwave",
        description: "Enable or disable Flutterwave as a payment method.",
    },
    {
        label: "Flutterwave ID",
        description: (
            <>
                API key for Flutterwave integration.{" "}
                <a
                    href="https://dashboard.flutterwave.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: "#0d6efd", textDecoration: "underline" }}
                >
                    Get it from Flutterwave Dashboard
                </a>
            </>
        ),
    },
];

// Ads Setting
export const androidAdsContent = [
    {
        label: "Android Google Reward",
        description: "Ad unit ID for rewarded ads on Android (users watch ads to earn rewards).",
    },
    {
        label: "Android Google Native",
        description: "Ad unit ID for native ads on Android (blend into app content).",
    },
    {
        label: "Android Google Native Video",
        description: "Ad unit ID for native video ads on Android (video ads integrated into app content).",
    },
];

export const iosAdsContent = [
    {
        label: "iOS Google Reward",
        description: "Ad unit ID for rewarded ads on iOS (users watch ads to earn rewards).",
    },
    {
        label: "iOS Google Native",
        description: "Ad unit ID for native ads on iOS (seamlessly integrated with UI).",
    },
    {
        label: "iOS Google Native Video",
        description: "Ad unit ID for native video ads on iOS (video ads integrated into app content).",
    },
];

// General Setting

export const resendApiSetting = [
    {
        label: "Resend API Key",
        description: (
            <>
                Key for Resend service to send OTPs, resets, and emails.{' '}
                <a
                    href="https://resend.com/api-keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500"
                >
                    Get it from Resend Dashboard
                </a>
                .
            </>
        ),
    }
]

export const zegoSetting = [
    {
        label: "Zego AppId",
        description: (
            <>
                Unique numeric ID for your ZegoCloud application.{" "}
                <a
                    href="https://console.zegocloud.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500"
                >
                    Get it from Zego Console
                </a>
                .
            </>
        ),
    },
    {
        label: "Zego App SignIn",
        description: (
            <>
                Security signature string used to authenticate with Zego services.{" "}
                <a
                    href="https://docs.zegocloud.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500"
                >
                    Learn how to generate it
                </a>
                .
            </>
        ),
    },
    {
        label: "Zego Server Secret",
        description: (
            <>
                Secret key for generating authentication tokens on your backend server.{" "}
                <a
                    href="https://docs.zegocloud.com/article/14802"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500"
                >
                    See Zego token generation guide
                </a>
                .
            </>
        ),
    },
];