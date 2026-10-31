import { Resend } from "resend";
import { formatPrice } from "@/lib/utils";
import { BookingPDFData, generateBookingPDFBuffer } from "@/lib/booking-pdf";

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

export interface SendBookingEmailOptions {
  booking: BookingPDFData;
  siteName?: string;
  siteLogo?: string | null;
  contactPhone?: string | null;
  contactEmail?: string | null;
  appBaseUrl?: string;
  type?: "CONFIRMATION" | "RECEIPT" | "REMINDER";
}

/**
 * Generate luxury HTML email template
 */
function buildBookingEmailHtml(
  booking: BookingPDFData,
  siteName: string,
  appBaseUrl: string,
  siteLogo?: string | null,
  contactPhone?: string | null,
  contactEmail?: string | null
): string {
  const checkInDate = new Date(booking.checkIn);
  const checkOutDate = new Date(booking.checkOut);
  const nights = Math.max(
    1,
    Math.round(
      (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)
    )
  );

  const checkInFormatted = checkInDate.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const checkOutFormatted = checkOutDate.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const bookingUrl = `${appBaseUrl}/booking/${booking.code}`;
  const isConfirmed = booking.status === "CONFIRMED" || booking.status === "COMPLETED" || booking.status === "CHECKED_IN";

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Konfirmasi Reservasi #${booking.code} - ${siteName}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f6f6f8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1a1a2e;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f6f6f8; padding: 30px 15px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06);">

          <!-- Header Banner -->
          <tr>
            <td style="background-color: #1a1a2e; padding: 32px 30px; text-align: center; border-bottom: 3px solid #C8A44E;">
              ${
                siteLogo
                  ? `<div style="margin-bottom: 12px;"><img src="${siteLogo.startsWith("http") ? siteLogo : `${appBaseUrl.replace(/\/$/, "")}${siteLogo.startsWith("/") ? siteLogo : `/${siteLogo}`}`}" alt="${siteName}" style="max-height: 48px; width: auto; max-width: 160px; object-fit: contain; display: inline-block;" /></div>`
                  : ""
              }
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700; letter-spacing: 2px;">
                ${siteName.toUpperCase()}<span style="color: #C8A44E;">.</span>
              </h1>
              <p style="margin: 6px 0 0 0; color: #C8A44E; font-size: 11px; letter-spacing: 1.5px; text-transform: uppercase;">
                Luxury Private Villas & Resorts
              </p>
            </td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td style="padding: 32px 30px;">
              <h2 style="margin: 0 0 12px 0; font-size: 20px; font-weight: 700; color: #1a1a2e;">
                ${isConfirmed ? "Pembayaran Diterima & Reservasi Dikonfirmasi!" : "Reservasi Berhasil Dibuat!"}
              </h2>
              <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #4a5568;">
                Halo <strong>${booking.guestName}</strong>, terima kasih telah memilih <strong>${siteName}</strong>.
                ${isConfirmed
                  ? "Pembayaran Anda telah kami verifikasi dengan sukses. Dokumen resmi voucher dan invoice telah terlampir pada email ini."
                  : "Detail reservasi Anda telah kami catat dalam sistem kami. Dokumen rincian transaksi telah kami lampirkan dalam bentuk file PDF."}
              </p>

              <!-- Booking Code Callout -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fcfaf6; border: 1px solid #e8e2d2; border-radius: 12px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 16px 20px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td>
                          <span style="font-size: 11px; text-transform: uppercase; color: #8a6e29; font-weight: 600; display: block; margin-bottom: 4px;">
                            Kode Booking Resmi:
                          </span>
                          <span style="font-size: 18px; font-family: monospace; font-weight: 700; color: #1a1a2e; letter-spacing: 1px;">
                            ${booking.code}
                          </span>
                        </td>
                        <td align="right">
                          <span style="display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: uppercase; background-color: ${isConfirmed ? "#e6f4ea" : "#fef3c7"}; color: ${isConfirmed ? "#137333" : "#b45309"};">
                            ${booking.status}
                          </span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Stay Details Table -->
              <h3 style="margin: 0 0 12px 0; font-size: 14px; font-weight: 700; color: #1a1a2e; text-transform: uppercase; letter-spacing: 0.5px;">
                Rincian Menginap
              </h3>
              <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #edf2f7; border-radius: 12px; overflow: hidden; margin-bottom: 24px;">
                <tr style="background-color: #f8fafc;">
                  <td style="padding: 12px 16px; font-size: 13px; color: #64748b; border-bottom: 1px solid #edf2f7; width: 40%;">Properti Villa</td>
                  <td style="padding: 12px 16px; font-size: 13px; font-weight: 600; color: #1a1a2e; border-bottom: 1px solid #edf2f7;">
                    ${booking.villa.name}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 16px; font-size: 13px; color: #64748b; border-bottom: 1px solid #edf2f7;">Check-In</td>
                  <td style="padding: 12px 16px; font-size: 13px; font-weight: 600; color: #1a1a2e; border-bottom: 1px solid #edf2f7;">
                    ${checkInFormatted} (Mulai 14:00 WIB)
                  </td>
                </tr>
                <tr style="background-color: #f8fafc;">
                  <td style="padding: 12px 16px; font-size: 13px; color: #64748b; border-bottom: 1px solid #edf2f7;">Check-Out</td>
                  <td style="padding: 12px 16px; font-size: 13px; font-weight: 600; color: #1a1a2e; border-bottom: 1px solid #edf2f7;">
                    ${checkOutFormatted} (Maks 12:00 WIB)
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 16px; font-size: 13px; color: #64748b; border-bottom: 1px solid #edf2f7;">Durasi & Tamu</td>
                  <td style="padding: 12px 16px; font-size: 13px; font-weight: 600; color: #1a1a2e; border-bottom: 1px solid #edf2f7;">
                    ${nights} Malam • ${booking.guestsCount} Orang Tamu
                  </td>
                </tr>
                ${
                  booking.addons && booking.addons.length > 0
                    ? `<tr>
                        <td style="padding: 12px 16px; font-size: 13px; color: #64748b; border-bottom: 1px solid #edf2f7;">Fasilitas Ekstra</td>
                        <td style="padding: 12px 16px; font-size: 13px; font-weight: 600; color: #1a1a2e; border-bottom: 1px solid #edf2f7;">
                          ${booking.addons.map((a) => `${a.name} (${a.qty} ${a.unit || "pcs"})`).join("<br/>")}
                        </td>
                      </tr>`
                    : ""
                }
                <tr style="background-color: #1a1a2e; color: #ffffff;">
                  <td style="padding: 14px 16px; font-size: 13px; font-weight: 600;">Total Biaya</td>
                  <td style="padding: 14px 16px; font-size: 16px; font-weight: 700; color: #C8A44E; text-align: right;">
                    ${formatPrice(booking.totalPrice)}
                  </td>
                </tr>
              </table>

              <!-- Attachment Callout Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; margin-bottom: 28px;">
                <tr>
                  <td style="padding: 14px 18px;">
                    <p style="margin: 0; font-size: 12.5px; color: #166534; line-height: 1.5;">
                      📎 <strong>Dokumen Terlampir:</strong> Kami telah melampirkan berkas <strong>Invoice & Voucher Reservasi (${booking.code}.pdf)</strong> pada email ini. Anda dapat mencetak atau menunjukkannya langsung kepada staf saat kedatangan.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Action Button CTA -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 28px;">
                <tr>
                  <td align="center">
                    <a href="${bookingUrl}" target="_blank" style="display: inline-block; background-color: #C8A44E; color: #1a1a2e; font-size: 14px; font-weight: 700; text-decoration: none; padding: 14px 32px; border-radius: 30px; letter-spacing: 0.5px; box-shadow: 0 4px 12px rgba(200, 164, 78, 0.3);">
                      Lihat Detail Reservasi di Web &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <!-- House Rules Highlights -->
              <div style="background-color: #f8fafc; border-radius: 12px; padding: 18px 20px; margin-bottom: 24px; font-size: 12px; color: #475569; line-height: 1.6;">
                <strong style="color: #1a1a2e; font-size: 13px; display: block; margin-bottom: 8px;">Informasi Penting Kedatangan:</strong>
                <ul style="margin: 0; padding-left: 18px;">
                  <li>Harap membawa kartu identitas (KTP/Paspor) yang sah saat proses check-in.</li>
                  <li>Dilarang merokok di dalam area kamar tidur (hanya diperbolehkan di teras outdoor).</li>
                  <li>Bantuan arah rute atau koordinasi kedatangan dapat menghubungi tim Concierge kami.</li>
                </ul>
              </div>

              <!-- Assistance Note -->
              <p style="margin: 0; font-size: 12px; color: #94a3b8; text-align: center; line-height: 1.5;">
                Butuh bantuan perjalanan? Hubungi Concierge WhatsApp kami di
                <a href="https://wa.me/${(contactPhone || "628111141888").replace(/\D/g, "").replace(/^0/, "62")}" style="color: #C8A44E; text-decoration: underline; font-weight: 600;">
                  ${contactPhone || "(+62) 811-1141-888"}
                </a>
                ${contactEmail ? `atau email ke <a href="mailto:${contactEmail}" style="color: #C8A44E; text-decoration: underline; font-weight: 600;">${contactEmail}</a>` : ""}
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; border-top: 1px solid #edf2f7; padding: 24px 30px; text-align: center;">
              <p style="margin: 0 0 6px 0; font-size: 12px; color: #64748b;">
                &copy; ${new Date().getFullYear()} ${siteName}. Hak Cipta Dilindungi.
              </p>
              <p style="margin: 0; font-size: 11px; color: #94a3b8;">
                Email konfirmasi otomatis untuk reservasi #${booking.code}.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

/**
 * Kirim email konfirmasi booking beserta lampiran PDF menggunakan Resend
 */
export async function sendBookingConfirmationEmail(
  options: SendBookingEmailOptions
): Promise<{
  success: boolean;
  message: string;
  emailId?: string;
  simulated?: boolean;
}> {
  const { booking, siteName = "Villa", appBaseUrl = process.env.AUTH_URL || "http://localhost:3000" } = options;

  try {
    // 1. Generate PDF Attachment Buffer with dynamic brand logo
    const pdfBuffer = await generateBookingPDFBuffer(
      booking,
      siteName,
      options.siteLogo,
      options.contactPhone,
      options.contactEmail
    );
    const pdfFilename = `Voucher-${siteName.toLowerCase().replace(/\s+/g, "-")}-${booking.code}.pdf`;

    // 2. Generate HTML Email Body
    const htmlBody = buildBookingEmailHtml(
      booking,
      siteName,
      appBaseUrl,
      options.siteLogo,
      options.contactPhone,
      options.contactEmail
    );

    // Subject
    const isConfirmed = booking.status === "CONFIRMED" || booking.status === "COMPLETED";
    const subject = isConfirmed
      ? `Konfirmasi & Voucher Menginap #${booking.code} - ${booking.villa.name} (${siteName})`
      : `Detail Reservasi & Tagihan #${booking.code} - ${booking.villa.name} (${siteName})`;

    // Check if Resend API Key is available
    if (!resend || !resendApiKey) {
      console.warn(
        `[Resend Mode Simulasi]: RESEND_API_KEY belum dikonfigurasi di file .env. ` +
        `Simulasi pengiriman email sukses ke ${booking.guestEmail} dengan lampiran ${pdfFilename} (${pdfBuffer.length} bytes).`
      );
      return {
        success: true,
        simulated: true,
        message: `Email simulasi berhasil diproses ke ${booking.guestEmail} (PDF terlampir ${pdfBuffer.length} bytes). Masukkan RESEND_API_KEY di .env untuk pengiriman nyata.`,
      };
    }

    // 3. Send email using Resend
    const sender = process.env.RESEND_FROM_EMAIL || `${siteName} <development-mail@lndev.online>`;
    const data = await resend.emails.send({
      from: sender,
      to: booking.guestEmail,
      subject,
      html: htmlBody,
      attachments: [
        {
          filename: pdfFilename,
          content: pdfBuffer,
        },
      ],
    });

    if (data.error) {
      console.error("[Resend Error]:", data.error);
      return {
        success: false,
        message: data.error.message || "Gagal mengirim email melalui Resend",
      };
    }

    return {
      success: true,
      emailId: data.data?.id,
      message: `Email voucher dan invoice resmi berhasil dikirim ke ${booking.guestEmail}`,
    };
  } catch (error: any) {
    console.error("[sendBookingConfirmationEmail Error]:", error);
    return {
      success: false,
      message: error.message || "Terjadi kesalahan internal saat pengiriman email",
    };
  }
}
