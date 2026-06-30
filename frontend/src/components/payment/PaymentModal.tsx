import { useEffect, useRef, useState, useCallback } from 'react';
import { createOrder } from '../../services/order.service';
import {
  createPayment,
  verifyPayment,
} from '../../services/payment.service';
import { getLoggedInUser } from '../../services/auth.service';
import { Modal, Alert } from '../../components/ui';
import type { CartItem } from '../../hooks/useCart';
import type { Payment } from '../../types';

interface PaymentModalProps {
  open: boolean;
  cart: CartItem[];
  cartTotal: number;
  selectedTableId: string;
  onClose: () => void;
  onSuccess: () => void;
}

type Step = 'select-method' | 'creating-order' | 'show-qr' | 'success' | 'error';

const POLL_INTERVAL_MS = 3000;
const POLL_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

const formatCurrency = (n: number) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(n);

export default function PaymentModal({
  open,
  cart,
  cartTotal,
  selectedTableId,
  onClose,
  onSuccess,
}: PaymentModalProps) {
  const [step, setStep] = useState<Step>('select-method');
  const [payment, setPayment] = useState<Payment | null>(null);
  const [error, setError] = useState('');
  const [pollCount, setPollCount] = useState(0);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const user = getLoggedInUser();

  // Cleanup timers on unmount / close
  const stopPolling = useCallback(() => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
    if (timeoutTimerRef.current) {
      clearTimeout(timeoutTimerRef.current);
      timeoutTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!open) {
      stopPolling();
      // Reset state after modal closes
      const timer = setTimeout(() => {
        setStep('select-method');
        setPayment(null);
        setError('');
        setPollCount(0);
      }, 300);
      return () => clearTimeout(timer);
    }
    return () => stopPolling();
  }, [open, stopPolling]);

  // Polling logic: call verifyPayment every POLL_INTERVAL_MS
  const startPolling = useCallback(
    (paymentId: string) => {
      stopPolling();

      // Timeout after 5 minutes
      timeoutTimerRef.current = setTimeout(() => {
        stopPolling();
        setError('Payment timeout. Please try again.');
        setStep('error');
      }, POLL_TIMEOUT_MS);

      // Poll every 3 seconds
      pollTimerRef.current = setInterval(async () => {
        try {
          const updated = await verifyPayment(paymentId);
          setPollCount((c) => c + 1);

          if (updated.status === 'COMPLETED') {
            stopPolling();
            setPayment(updated);
            setStep('success');
          } else if (
            updated.status === 'FAILED' ||
            updated.status === 'EXPIRED'
          ) {
            stopPolling();
            setError(`Payment ${updated.status.toLowerCase()}. Please try again.`);
            setStep('error');
          }
          // PENDING → keep polling
        } catch {
          // Poll error — show message after 3 consecutive failures
          setPollCount((c) => {
            const next = c + 1;
            if (next > 3 && next % 3 === 0) {
              setError('Still waiting for payment server…');
            }
            return next;
          });
        }
      }, POLL_INTERVAL_MS);
    },
    [stopPolling],
  );

  // Order + Payment creation
  async function handleBankTransfer() {
    if (!user) {
      setError('You must be logged in');
      return;
    }
    setStep('creating-order');
    setError('');

    try {
      // 1. Create the order
      const order = await createOrder({
        userId: user.id,
        tableId: selectedTableId || undefined,
        items: cart.map((c) => ({
          menuItemId: c.menuItem.id,
          quantity: c.quantity,
          note: c.note || undefined,
        })),
      });

      // 2. Create the payment (QR code)
      const pay = await createPayment(order.id);
      setPayment(pay);

      // 3. Show QR and start polling
      setStep('show-qr');
      startPolling(pay.id);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Failed to create payment';
      setError(msg);
      setStep('error');
    }
  }

  async function handleCashPayment() {
    if (!user) {
      setError('You must be logged in');
      return;
    }
    setStep('creating-order');
    setError('');

    try {
      await createOrder({
        userId: user.id,
        tableId: selectedTableId || undefined,
        items: cart.map((c) => ({
          menuItemId: c.menuItem.id,
          quantity: c.quantity,
          note: c.note || undefined,
        })),
      });
      setStep('success');
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Failed to place order';
      setError(msg);
      setStep('error');
    }
  }

  // Switch from Bank Transfer to Cash — stop polling, finalize as cash
  function handleSwitchToCash() {
    stopPolling();
    onSuccess();
    onClose();
  }

  // Manual "I have transferred" — single verify call
  async function handleManualVerify() {
    if (!payment) return;
    setError('');
    try {
      const updated = await verifyPayment(payment.id);
      if (updated.status === 'COMPLETED') {
        stopPolling();
        setPayment(updated);
        setStep('success');
      } else if (
        updated.status === 'FAILED' ||
        updated.status === 'EXPIRED'
      ) {
        stopPolling();
        setError(`Payment ${updated.status.toLowerCase()}.`);
        setStep('error');
      } else {
        setPayment(updated);
        setError('Transaction not found yet. Please wait a moment and try again.');
        setStep('show-qr');
      }
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : 'Verification failed',
      );
    }
  }

  function handleRetry() {
    setStep('select-method');
    setPayment(null);
    setError('');
    setPollCount(0);
    stopPolling();
  }

  function handleCloseSuccess() {
    stopPolling();
    onSuccess();
    onClose();
  }

  // ── Render helpers ──

  function renderMethodSelection() {
    return (
      <>
        <p className="payment-info">
          Total: <strong>{formatCurrency(cartTotal)}</strong>
        </p>
        <div className="payment-methods">
          <button
            className="payment-method-btn"
            onClick={handleCashPayment}
          >
            <span className="payment-method-icon">💵</span>
            <span className="payment-method-label">Cash</span>
          </button>
          <button
            className="payment-method-btn"
            onClick={handleBankTransfer}
          >
            <span className="payment-method-icon">🏦</span>
            <span className="payment-method-label">Bank Transfer (SePay)</span>
          </button>
        </div>
        {error && <Alert variant="error">{error}</Alert>}
      </>
    );
  }

  function renderCreating() {
    return (
      <div className="payment-creating">
        <div className="spinner" />
        <p>Creating order…</p>
      </div>
    );
  }

  function renderQR() {
    if (!payment) return null;
    return (
      <div className="payment-qr-container">
        <h3>Scan QR Code to Pay</h3>

        <div className="payment-qr-body">
          <div className="payment-qr-card">
            <img
              className="payment-qr-img"
              src={payment.qrUrl}
              alt="VietQR payment code"
            />
          </div>
        </div>

        {/* Polling status */}
        <div className="payment-waiting">
          <span className="payment-pulse" />
          <span>Waiting for payment…</span>
          <span className="payment-poll-count">
            (checked {pollCount + 1} time{pollCount !== 0 ? 's' : ''})
          </span>
        </div>

        {error && <Alert variant="error">{error}</Alert>}

        <button
          className="btn btn-primary btn-block"
          onClick={handleManualVerify}
          style={{ marginTop: 8 }}
        >
          I have transferred
        </button>

        <button
          className="btn-pay-cash"
          onClick={handleSwitchToCash}
        >
          Pay with Cash instead
        </button>
      </div>
    );
  }

  function renderSuccess() {
    return (
      <div className="payment-result payment-result--success">
        <span className="payment-result-icon">✅</span>
        <h3>Payment Successful!</h3>
        {payment && (
          <p className="payment-result-amount">
            {formatCurrency(Number(payment.amount))}
          </p>
        )}
        <button
          className="btn btn-primary btn-block"
          onClick={handleCloseSuccess}
          style={{ marginTop: 16 }}
        >
          Done
        </button>
      </div>
    );
  }

  function renderError() {
    return (
      <div className="payment-result payment-result--error">
        <span className="payment-result-icon">❌</span>
        <h3>Payment Failed</h3>
        {error && <Alert variant="error">{error}</Alert>}
        <div className="payment-result-actions">
          <button
            className="btn btn-secondary"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleRetry}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const modalTitle =
    step === 'select-method'
      ? 'Select Payment Method'
      : step === 'creating-order'
      ? 'Processing…'
      : step === 'show-qr'
      ? 'Bank Transfer'
      : step === 'success'
      ? 'Payment Complete'
      : 'Payment Failed';

  return (
    <Modal open={open} onClose={onClose} title={modalTitle}>
      {step === 'select-method' && renderMethodSelection()}
      {step === 'creating-order' && renderCreating()}
      {step === 'show-qr' && renderQR()}
      {step === 'success' && renderSuccess()}
      {step === 'error' && renderError()}
    </Modal>
  );
}
