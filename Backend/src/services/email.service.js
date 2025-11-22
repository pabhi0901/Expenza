import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
        user: process.env.SMTP_USER,        // TERA GMAIL
        pass: process.env.EMAIL_PASSWORD_SMTP            // 16-DIGIT APP PASSWORD (NO SPACES)
    }
});

let sendEmail = async (to, subject, html) => {
    try {
        const info = await transporter.sendMail({
            from:`"Expenza Team" <${process.env.SMTP_USER}>`,
            to,
            subject,
            html
        });

        console.log("Mail sent:", info.messageId);
        return true;
    } catch (err) {
        console.error("Mail error:", err);
        return false;
    }
};


export default  sendEmail   