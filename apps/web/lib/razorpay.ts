type RazorpaySuccessResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

type RazorpayCheckoutOptions = {
  key: string;
  amount: number;
  currency: string;
  orderId: string;
  name: string;
  description: string;
  prefill?: {
    name?: string;
    email?: string;
  };
  onSuccess: (response: RazorpaySuccessResponse) => void | Promise<void>;
  onDismiss?: () => void;
};

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      open: () => void;
      on: (event: string, handler: () => void) => void;
    };
  }
}

let scriptPromise: Promise<boolean> | null = null;

export function loadRazorpayScript(): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (window.Razorpay) return Promise.resolve(true);

  if (!scriptPromise) {
    scriptPromise = new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  }

  return scriptPromise;
}

export async function openRazorpayCheckout(options: RazorpayCheckoutOptions): Promise<void> {
  const loaded = await loadRazorpayScript();
  if (!loaded || !window.Razorpay) {
    throw new Error("Unable to load Razorpay checkout. Please try again.");
  }

  return new Promise((resolve, reject) => {
    const checkout = new window.Razorpay!({
      key: options.key,
      amount: options.amount,
      currency: options.currency,
      name: options.name,
      description: options.description,
      order_id: options.orderId,
      prefill: options.prefill,
      theme: {
        color: "#4f46e5",
      },
      handler: async (response: RazorpaySuccessResponse) => {
        try {
          await options.onSuccess(response);
          resolve();
        } catch (error) {
          reject(error);
        }
      },
      modal: {
        ondismiss: () => {
          options.onDismiss?.();
          resolve();
        },
      },
    });

    checkout.on("payment.failed", () => {
      reject(new Error("Payment failed. Please try again."));
    });

    checkout.open();
  });
}
