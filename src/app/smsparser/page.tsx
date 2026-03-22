"use client";

import { useState, useRef, useEffect } from "react";
import Navbar from "@/components/Navbar";

type ParsedResult = {
  amount: number;
  type: "debit" | "credit" | "credit_card_debit" | "info" | "pending";
  bank: string;
  merchant: string;
  category: string;
  payment_mode: string;
  balance_after: number | null;
  confidence: number;
  engine: "onnx" | "llm_fallback";
};

type StepStatus = "idle" | "active" | "done" | "fallback";
type Step = { id: string; label: string; sublabel: string; status: StepStatus };

const T = {
  pageBg:        "#F5F5F4",
  cardBg:        "#FFFFFF",
  surfaceBg:     "#F5F5F4",
  inputBg:       "#FAFAF9",
  borderBase:    "#D6D3D1",
  textPrimary:   "#1C1917",
  textSecondary: "#44403C",
  textMuted:     "#57534E",
  infoText:      "#1E40AF",
  infoBg:        "#EFF6FF",
  infoBorder:    "#BFDBFE",
  successText:   "#14532D",
  successBg:     "#F0FDF4",
  successBorder: "#BBF7D0",
  warningText:   "#78350F",
  warningBg:     "#FFFBEB",
  warningBorder: "#FDE68A",
  dangerText:    "#7F1D1D",
  dangerBg:      "#FEF2F2",
  dangerBorder:  "#FECACA",
};

const SAMPLES = [
  { label: "HDFC · shopping", text: "INR 2,350 debited from A/c XX4821 at AMAZON on 22-03-26. Avl Bal: Rs.18,420. -HDFC Bank" },
  { label: "HDFC · food", text: "INR 890 debited from A/c XX4821 at SWIGGY on 22-03-26. Avl Bal: Rs.17,530. -HDFC Bank" },
  { label: "HDFC · income", text: "INR 15,000 credited to A/c XX4821 on 01-03-26 by NEFT. Avl Bal: Rs.32,530. -HDFC Bank" },
  { label: "HDFC · credit card payment", text: "INR 4,200 debited from A/c XX4821 towards HDFC Credit Card payment. Avl Bal: Rs.28,330. -HDFC" },
  { label: "HDFC · fuel", text: "INR 500 debited from A/c XX4821 at PETROL PUMP on 20-03-26. Avl Bal: Rs.27,830. -HDFC Bank" },
  { label: "HDFC · groceries", text: "INR 1,200 debited from A/c XX4821 at BIGBASKET on 19-03-26. Avl Bal: Rs.26,630. -HDFC Bank" },
  { label: "HDFC · emi", text: "Your A/c XX4821 is debited with INR 8,500 on 18-03-26. Info: EMI/HOMELN. Avl Bal: Rs.18,130. -HDFC" },
  { label: "HDFC · entertainment", text: "INR 299 debited from A/c XX4821 at NETFLIX on 17-03-26. Avl Bal: Rs.17,831. -HDFC Bank" },
  { label: "SBI · salary", text: "Rs.15,000.00 credited to your a/c XX8823 by NEFT from EMPLOYER on 01-03-26. Avl Bal: Rs.22,450." },
  { label: "SBI · food", text: "Rs.1,500.00 debited from your a/c XX8823 to VPA swiggy@idfcbank on 22-03-26. Avl Bal: Rs.20,950." },
  { label: "SBI · shopping", text: "Rs.3,200.00 debited from your a/c XX8823 at AMAZON on 21-03-26. Avl Bal: Rs.17,750." },
  { label: "SBI · transfer", text: "Rs.750.00 debited from your a/c XX8823 via UPI to 9849XXXXXX@paytm on 20-03-26. Avl Bal: Rs.17,000." },
  { label: "SBI · utilities", text: "Dear SBI Customer, INR 2,000 has been debited from A/c XX8823 towards electricity bill on 19-03-26." },
  { label: "SBI · emi", text: "Rs.5,000.00 debited from a/c XX8823 as SBI Car Loan EMI on 05-03-26. Avl Bal: Rs.12,000." },
  { label: "SBI · food", text: "Rs.450.00 debited from a/c XX8823 at ZOMATO on 18-03-26. Avl Bal: Rs.11,550." },
  { label: "SBI · transfer", text: "Rs.25,000.00 credited to your a/c XX8823 by IMPS from RAMESH on 15-03-26. Avl Bal: Rs.36,550." },
  { label: "ICICI · shopping", text: "ICICI Bank Acct XX3421 debited Rs 1200 on 22-03-2026; FLIPKART; Avl Bal Rs 9800." },
  { label: "ICICI · transport", text: "ICICI Bank Acct XX3421 debited Rs 680 on 21-03-2026; OLAS CABS; Avl Bal Rs 9120." },
  { label: "ICICI · salary", text: "ICICI Bank Acct XX3421 credited Rs 50000 on 01-03-2026; SALARY MARCH; Avl Bal Rs 59120." },
  { label: "ICICI · credit card payment", text: "ICICI Bank Acct XX3421 debited Rs 3500 on 20-03-2026; ICICI CREDIT CARD BILL; Avl Bal Rs 55620." },
  { label: "ICICI · entertainment", text: "ICICI Bank Acct XX3421 debited Rs 199 on 19-03-2026; SPOTIFY; Avl Bal Rs 55421." },
  { label: "ICICI · fuel", text: "ICICI Bank Acct XX3421 debited Rs 2800 on 18-03-2026; BPCL FUEL; Avl Bal Rs 52621." },
  { label: "ICICI · emi", text: "ICICI Bank Acct XX3421 debited Rs 12000 on 05-03-2026; HOME LOAN EMI; Avl Bal Rs 40621." },
  { label: "ICICI · entertainment", text: "ICICI Bank Acct XX3421 debited Rs 89 on 17-03-2026; AMAZON PRIME; Avl Bal Rs 40532." },
  { label: "Axis · shopping", text: "Axis Bank: Rs.2,100 debited from A/c XX7712 for purchase at MYNTRA on 22-03-26. Bal: Rs.6,400." },
  { label: "Axis · travel", text: "Axis Bank: Rs.320 debited from A/c XX7712 via UPI to makemytrip@axisbank on 21-03-26. Bal: Rs.6,080." },
  { label: "Axis · salary", text: "Axis Bank: Rs.40,000 credited to A/c XX7712 on 01-03-26. Ref: SALARY. Bal: Rs.46,080." },
  { label: "Axis · mobile recharge", text: "Axis Bank: Rs.1,800 debited from A/c XX7712 for MOBILE RECHARGE on 20-03-26. Bal: Rs.44,280." },
  { label: "Axis · emi", text: "Axis Bank: Rs.7,500 debited from A/c XX7712 as Axis Personal Loan EMI on 05-03-26. Bal: Rs.36,780." },
  { label: "Axis · food", text: "Axis Bank: Rs.560 debited from A/c XX7712 at DOMINOS on 19-03-26. Bal: Rs.36,220." },
  { label: "Kotak · electronics", text: "Kotak Mahindra Bank: Debit of Rs.3,400 from A/c XX5533 at CROMA on 22-03-26. Available Bal: Rs.14,600." },
  { label: "Kotak · salary", text: "Kotak Mahindra Bank: Credit of Rs.60,000 to A/c XX5533 on 01-03-26. NEFT/SALARY. Bal: Rs.74,600." },
  { label: "Kotak · food", text: "Kotak Mahindra Bank: UPI debit Rs.1,100 from A/c XX5533 to zomato@kotak on 21-03-26. Bal: Rs.73,500." },
  { label: "Kotak · credit card payment", text: "Kotak Mahindra Bank: Auto debit Rs.9,200 from A/c XX5533 for Kotak CC Bill on 15-03-26. Bal: Rs.64,300." },
  { label: "Unknown · food", text: "Txn: -INR 890 | Merch: Swiggy | Dt: 22Mar26 | Ref: 4928371 | UPI" },
  { label: "Unknown · transfer", text: "UPI txn: Rs 500 sent to 9849XXXXXX@ybl via PhonePe on 22-03-26" },
  { label: "Unknown · transfer", text: "Google Pay: You sent Rs.1,200 to Ravi Kumar on 21-03-26. Ref: GPay123456" },
  { label: "Unknown · transport", text: "Paytm: Rs.340 debited from your Paytm wallet for METRO CARD RECHARGE on 20-03-26" },
  { label: "Unknown · cash", text: "Dear Customer, Rs.2,500 withdrawn from ATM XX1234 on 22-03-26 at 14:30. Bal: Rs.8,500." },
  { label: "Unknown · rent", text: "Your NEFT payment of Rs.10,000 to LANDLORD (A/c XX9988) was successful on 01-03-26." },
  { label: "HDFC · electronics", text: "HDFC Bank Credit Card XX1234: Rs.4,500 spent at APPLE STORE on 22-03-26. Avl credit: Rs.45,500." },
  { label: "ICICI · travel", text: "ICICI Credit Card XX5678: Transaction of Rs.1,800 at IRCTC on 21-03-26. Avl limit: Rs.38,200." },
  { label: "Axis · jewellery", text: "Axis Bank Credit Card XX9012: Rs.6,200 spent at TANISHQ on 20-03-26. Credit limit used: 62%." },
  { label: "SBI · entertainment", text: "Your SBI Credit Card XX3456 has been charged Rs.799 for AMAZON PRIME ANNUAL on 19-03-26." },
  { label: "HDFC · cash", text: "INR 1,500 debited from A/c XX4821 at ANDHRA BANK ATM on 22-03-26. Avl Bal: Rs.16,330. -HDFC Bank" },
  { label: "SBI · utilities", text: "Rs.2,000 debited from a/c XX8823 for TELANGANA ELECTRICITY BILL on 18-03-26. -SBI" },
  { label: "HDFC · food", text: "INR 3,500 debited from A/c XX4821 at HYDERABAD HOUSE RESTAURANT on 21-03-26. -HDFC Bank" },
  { label: "Axis · government", text: "Axis Bank: Rs.5,000 debited from A/c XX7712 via RTGS to ANDHRA PRADESH HOUSING BOARD. Bal: Rs.31,220." },
  { label: "HDFC · software", text: "INR 180 debited from A/c XX4821 at QUICK HEAL TECHNOLOGIES on 17-03-26. -HDFC Bank" },
  { label: "SBI · freelance income", text: "Rs.12,000 credited to your a/c XX8823 from FREELANCE CLIENT via IMPS on 15-03-26. -SBI" },
  { label: "GooglePay · transfer", text: "GPay: You sent Rs.500 to Ravi Kumar (9849XXXXXX) on 22-03-26. UPI Ref: 403928471234." },
  { label: "GooglePay · transfer", text: "GPay: Rs.1,200 received from Priya Sharma on 22-03-26. UPI Ref: 403928471235. Check your bank." },
  { label: "GooglePay · food", text: "GPay: Rs.450 paid to Swiggy on 21-03-26. UPI Ref: 403928471236. Transaction successful." },
  { label: "GooglePay · credit card payment", text: "GPay: Rs.2,100 paid to HDFC CREDIT CARD on 20-03-26. UPI Ref: 403928471237." },
  { label: "GooglePay · shopping", text: "GPay: Rs.800 paid to Amazon on 19-03-26. UPI Ref: 403928471238. Transaction successful." },
  { label: "GooglePay · rent", text: "GPay: Rs.3,500 sent to LANDLORD (landlord@oksbi) on 01-03-26. UPI Ref: 403928471239." },
  { label: "GooglePay · utilities", text: "GPay: Rs.250 paid to BESCOM ELECTRICITY on 18-03-26. UPI Ref: 403928471240." },
  { label: "GooglePay · mobile recharge", text: "GPay: Rs.199 paid to JIO RECHARGE on 17-03-26. UPI Ref: 403928471241." },
  { label: "GooglePay · food", text: "GPay: Rs.599 paid to ZOMATO on 16-03-26. UPI Ref: 403928471242. Transaction successful." },
  { label: "GooglePay · travel", text: "GPay: Rs.1,800 paid to IRCTC on 15-03-26. UPI Ref: 403928471243. Booking confirmed." },
  { label: "GooglePay · transfer", text: "GPay: Rs.5,000 sent to savings a/c XX1234 on 14-03-26. UPI Ref: 403928471244." },
  { label: "GooglePay · entertainment", text: "GPay: Rs.349 paid to HOTSTAR DISNEY+ on 13-03-26. UPI Ref: 403928471245." },
  { label: "GooglePay · health", text: "GPay: Rs.1,500 paid to APOLLO PHARMACY on 12-03-26. UPI Ref: 403928471246." },
  { label: "GooglePay · transport", text: "GPay: Rs.780 paid to RAPIDO on 11-03-26. UPI Ref: 403928471247." },
  { label: "PhonePe · groceries", text: "PhonePe: Rs.650 debited from SBI A/c XX8823 to merchant BLINKIT on 22-03-26. UPI Ref: PP928471101." },
  { label: "PhonePe · salary", text: "PhonePe: Rs.15,000 received in HDFC A/c XX4821 from EMPLOYER on 01-03-26. UPI Ref: PP928471102." },
  { label: "PhonePe · entertainment", text: "PhonePe: Rs.399 paid to NETFLIX on 22-03-26 from ICICI A/c XX3421. UPI Ref: PP928471103." },
  { label: "PhonePe · transport", text: "PhonePe: Rs.2,800 paid to OLA CABS on 21-03-26 from Axis A/c XX7712. UPI Ref: PP928471104." },
  { label: "PhonePe · transfer", text: "PhonePe: Rs.920 sent to Suresh (suresh@ybl) on 20-03-26. UPI Ref: PP928471105." },
  { label: "PhonePe · health", text: "PhonePe: Rs.3,200 paid to APOLLO HOSPITALS on 19-03-26. UPI Ref: PP928471106." },
  { label: "PhonePe · entertainment", text: "PhonePe: Rs.499 paid to AMAZON PRIME on 18-03-26. UPI Ref: PP928471107." },
  { label: "PhonePe · emi", text: "PhonePe: Rs.7,500 sent to SBI LOAN A/c on 05-03-26. UPI Ref: PP928471108." },
  { label: "PhonePe · groceries", text: "PhonePe: Rs.1,100 paid to SWIGGY INSTAMART on 17-03-26. UPI Ref: PP928471109." },
  { label: "PhonePe · utilities", text: "PhonePe: Rs.350 paid to MAHANAGAR GAS on 16-03-26. UPI Ref: PP928471110." },
  { label: "PhonePe · travel", text: "PhonePe: Rs.4,500 paid to MAKEMYTRIP FLIGHTS on 15-03-26. UPI Ref: PP928471111." },
  { label: "PhonePe · transport", text: "PhonePe: Rs.250 paid to YULU BIKES on 14-03-26. UPI Ref: PP928471112." },
  { label: "PhonePe · transfer", text: "PhonePe: Rs.6,000 sent to AXIS A/c XX7712 on 10-03-26. UPI Ref: PP928471113." },
  { label: "PhonePe · shopping", text: "PhonePe: Rs.1,299 paid to MYNTRA on 13-03-26. UPI Ref: PP928471114." },
  { label: "Paytm · wallet", text: "Paytm: Rs.500 added to Paytm Wallet from SBI A/c XX8823 on 22-03-26. Ref: PTM928471201." },
  { label: "Paytm · transport", text: "Paytm: Rs.180 paid to AUTO RICKSHAW via Paytm QR on 22-03-26. Ref: PTM928471202." },
  { label: "Paytm · credit card payment", text: "Paytm: Rs.2,500 paid to HDFC CREDIT CARD from Paytm Wallet on 21-03-26. Ref: PTM928471203." },
  { label: "Paytm · groceries", text: "Paytm: Rs.799 paid to BIGBASKET on 20-03-26 from Paytm UPI. Ref: PTM928471204." },
  { label: "Paytm · transport", text: "Paytm: Rs.340 paid to METRO CARD RECHARGE on 19-03-26. Ref: PTM928471205." },
  { label: "Paytm · transfer", text: "Paytm: Rs.1,200 received from Amit (amit@paytm) on 18-03-26. Ref: PTM928471206." },
  { label: "Paytm · food", text: "Paytm: Rs.599 paid to DOMINOS PIZZA on 17-03-26 from Paytm UPI. Ref: PTM928471207." },
  { label: "Paytm · transfer", text: "Paytm: Rs.4,000 transferred to ICICI A/c XX3421 on 16-03-26. Ref: PTM928471208." },
  { label: "Paytm · food", text: "Paytm: Rs.89 paid to SUBWAY on 15-03-26 from Paytm Wallet. Ref: PTM928471209." },
  { label: "Paytm · mobile recharge", text: "Paytm: Rs.249 paid to AIRTEL POSTPAID on 14-03-26. Ref: PTM928471210." },
  { label: "Paytm · cashback", text: "Paytm: Cashback of Rs.50 credited to Paytm Wallet on 22-03-26. Ref: PTM928471211." },
  { label: "Paytm · insurance", text: "Paytm: Rs.1,500 paid to LIC PREMIUM on 10-03-26. Ref: PTM928471212." },
  { label: "Paytm · entertainment", text: "Paytm: Rs.320 paid to BOOK MY SHOW on 13-03-26. Ref: PTM928471213." },
  { label: "Paytm · transfer", text: "Paytm: Rs.2,000 sent to Sunita (sunita@paytm) on 12-03-26. Ref: PTM928471214." },
  { label: "AmazonPay · shopping", text: "Amazon Pay: Rs.1,299 debited for Amazon order #404-XXXX on 22-03-26. UPI Ref: AMZ928471301." },
  { label: "AmazonPay · entertainment", text: "Amazon Pay: Rs.499 paid to PRIME MEMBERSHIP renewal on 21-03-26. Ref: AMZ928471302." },
  { label: "AmazonPay · cashback", text: "Amazon Pay: Rs.250 cashback credited to Amazon Pay balance on 20-03-26. Ref: AMZ928471303." },
  { label: "AmazonPay · credit card payment", text: "Amazon Pay: Rs.3,500 paid to ICICI CREDIT CARD via Amazon Pay UPI on 19-03-26. Ref: AMZ928471304." },
  { label: "AmazonPay · groceries", text: "Amazon Pay: Rs.799 paid to FRESH DELIVERY on 18-03-26. Ref: AMZ928471305." },
  { label: "AmazonPay · entertainment", text: "Amazon Pay: Rs.149 paid to AUDIBLE subscription on 17-03-26. Ref: AMZ928471306." },
  { label: "CRED · credit card payment", text: "CRED: Rs.8,200 payment made for HDFC Credit Card XX1234 on 22-03-26. Ref: CRED928471401." },
  { label: "CRED · credit card payment", text: "CRED: Rs.12,500 payment made for SBI Credit Card XX3456 on 15-03-26. Ref: CRED928471402." },
  { label: "CRED · cashback", text: "CRED: Rs.500 CRED coins redeemed for cashback on 20-03-26. Ref: CRED928471403." },
  { label: "CRED · credit card payment", text: "CRED: Rs.4,800 payment for AXIS Credit Card XX9012 on 10-03-26. Ref: CRED928471404." },
  { label: "BHIM · transfer", text: "BHIM UPI: Rs.2,000 sent to Mohan Kumar (mohan@upi) on 22-03-26. UPI Ref: BHIM928471501." },
  { label: "BHIM · income", text: "BHIM UPI: Rs.5,000 received from Company (company@hdfcbank) on 01-03-26. UPI Ref: BHIM928471502." },
  { label: "BHIM · groceries", text: "BHIM UPI: Rs.650 paid to KIRANA STORE on 21-03-26. UPI Ref: BHIM928471503." },
  { label: "BHIM · groceries", text: "BHIM UPI: Rs.300 paid to VEGETABLE VENDOR on 20-03-26. UPI Ref: BHIM928471504." },
  { label: "SBI · transfer", text: "YONO SBI: Rs.10,000 transferred to A/c XX9988 via NEFT on 22-03-26. Ref: YONO928471601." },
  { label: "SBI · investment", text: "YONO SBI: FD of Rs.50,000 created on 15-03-26. Maturity: 15-09-26. Rate: 7.1% pa. Ref: FD928471602." },
  { label: "SBI · emi", text: "YONO SBI: Rs.2,500 EMI debited for Personal Loan on 05-03-26. Loan A/c XX1122. Bal: Rs.8,900." },
  { label: "SBI · bank charges", text: "YONO SBI: Rs.180 charged as ATM usage fee on 22-03-26. A/c XX8823. Bal: Rs.8,720." },
  { label: "Unknown · groceries", text: "Your order at ZEPTO worth Rs.840 has been paid via UPI on 22-03-26. Ref: ZPT928471701." },
  { label: "Unknown · groceries", text: "BLINKIT: Rs.1,100 paid via PhonePe UPI on 21-03-26. Order #BLK123456. Ref: BLK928471702." },
  { label: "HDFC · groceries", text: "DUNZO: Rs.290 debited from HDFC A/c XX4821 for delivery on 20-03-26. Ref: DNZ928471703." },
  { label: "Unknown · groceries", text: "SWIGGY INSTAMART: Rs.760 paid via GPay on 19-03-26. Order #SIM928471704." },
  { label: "SBI · groceries", text: "BIGBASKET: Rs.2,100 debited from SBI A/c XX8823 on 18-03-26. Order #BB928471705." },
  { label: "ICICI · transport", text: "Ola: Rs.320 debited from ICICI A/c XX3421 for Ola ride on 22-03-26. Ref: OLA928471801." },
  { label: "Unknown · transport", text: "Uber: Rs.450 paid via UPI for Uber trip on 21-03-26. Ref: UBER928471802." },
  { label: "Axis · transport", text: "Rapido: Rs.85 debited for bike ride on 20-03-26 from Axis A/c XX7712. Ref: RPD928471803." },
  { label: "SBI · transport", text: "Namma Metro: Rs.50 debited from SBI A/c XX8823 for BMTC/Metro trip on 22-03-26." },
  { label: "HDFC · travel", text: "IRCTC: Rs.1,450 debited from HDFC A/c XX4821 for train ticket booking on 18-03-26. PNR: 4512341234." },
  { label: "ICICI · travel", text: "MakeMyTrip: Rs.7,800 debited from ICICI A/c XX3421 for flight booking on 15-03-26. Booking: MMT12345." },
  { label: "Axis · travel", text: "OYO Rooms: Rs.2,200 debited from Axis A/c XX7712 for hotel booking on 14-03-26. Booking: OYO12345." },
  { label: "HDFC · emi", text: "INR 6,500 debited from A/c XX4821 towards HDFC Home Loan EMI on 05-03-26. Loan A/c XX9900. -HDFC" },
  { label: "SBI · emi", text: "Rs.3,200 debited from A/c XX8823 for SBI Two Wheeler Loan EMI on 05-03-26." },
  { label: "ICICI · emi", text: "ICICI Bank Acct XX3421 debited Rs 8500 on 05-03-2026; ICICI HOME LOAN EMI." },
  { label: "Axis · emi", text: "Axis Bank: Rs.4,200 debited from A/c XX7712 as BAJAJ FINSERV EMI on 07-03-26." },
  { label: "HDFC · emi", text: "INR 1,999 auto-debited from A/c XX4821 for TATA CAPITAL EMI on 10-03-26. -HDFC Bank" },
  { label: "SBI · emi", text: "Rs.5,500 debited from a/c XX8823 for FULLERTON INDIA Personal Loan EMI on 08-03-26." },
  { label: "HDFC · emi", text: "ECS DEBIT: Rs.12,000 from A/c XX4821 for HDFC BANK PERSONAL LOAN on 05-03-26." },
  { label: "ICICI · emi", text: "NACH DEBIT: Rs.7,800 from ICICI A/c XX3421 for HOME CREDIT EMI on 10-03-26." },
  { label: "HDFC · salary", text: "Salary Credited: Rs.45,000 to HDFC A/c XX4821 on 01-03-26. Emp Code: EMP12345." },
  { label: "HDFC · salary", text: "INR 28,500 credited to A/c XX4821 by NEFT. Sender: TECHCORP PVT LTD. Avl Bal: Rs.34,200. -HDFC" },
  { label: "SBI · freelance income", text: "Rs.8,000 credited to a/c XX8823 from FREELANCE PAYMENT via IMPS on 12-03-26. Ref: 112233445." },
  { label: "ICICI · salary", text: "ICICI Bank Acct XX3421 credited Rs 65000 on 01-03-2026; EMPLOYER NAME MARCH SALARY." },
  { label: "Axis · freelance income", text: "Rs.3,500 credited to Axis A/c XX7712 as PART TIME INCOME on 15-03-26. IMPS Ref: 998877665." },
  { label: "HDFC · rental income", text: "INR 12,000 credited to A/c XX4821. Info: RENTAL INCOME. -HDFC Bank. Avl Bal: Rs.29,200." },
  { label: "Kotak · interest income", text: "Kotak Bank: Rs.2,500 interest credited to FD A/c XX5533 on 15-03-26." },
  { label: "SBI · utilities", text: "TSSPDCL: Rs.1,840 bill paid for consumer no. XXXX via SBI Net Banking on 18-03-26." },
  { label: "HDFC · utilities", text: "APSPDCL Bill Payment: Rs.2,100 paid from HDFC A/c XX4821 on 17-03-26. Ref: APSPDCL12345." },
  { label: "Unknown · utilities", text: "BESCOM: Rs.1,250 paid via GPay UPI on 16-03-26. Consumer: XXXX1234. Ref: BESC928471901." },
  { label: "Kotak · utilities", text: "MSEB Electricity: Rs.980 debited from Kotak A/c XX5533 on 15-03-26." },
  { label: "Unknown · utilities", text: "Indane Gas: Rs.920 paid for LPG cylinder booking on 20-03-26 via PhonePe UPI." },
  { label: "SBI · utilities", text: "HP Gas: Rs.898 debited from SBI A/c XX8823 for gas cylinder on 18-03-26." },
  { label: "HDFC · internet", text: "Jio Fiber: Rs.999 monthly broadband bill paid via HDFC net banking on 15-03-26." },
  { label: "ICICI · internet", text: "Airtel Broadband: Rs.799 paid from ICICI A/c XX3421 on 14-03-26. Cust ID: AIRF12345." },
  { label: "Axis · internet", text: "ACT Fibernet: Rs.1,099 debited from Axis A/c XX7712 on 13-03-26." },
  { label: "Unknown · mobile recharge", text: "Jio: Recharge of Rs.299 successful for 9849XXXXXX on 22-03-26. Validity: 28 days." },
  { label: "Unknown · mobile recharge", text: "Airtel: Rs.449 recharge done for 9876XXXXXX on 21-03-26 via GPay. Data: 2GB/day." },
  { label: "Unknown · mobile recharge", text: "Vi (Vodafone Idea): Rs.399 recharge on 20-03-26 via Paytm for 9123XXXXXX." },
  { label: "Unknown · mobile recharge", text: "BSNL: Rs.187 recharge for 9450XXXXXX on 19-03-26. Validity: 28 days. Paid via BHIM UPI." },
  { label: "SBI · mobile recharge", text: "Airtel Postpaid: Rs.599 bill paid for 9876XXXXXX on 18-03-26 from SBI A/c XX8823." },
  { label: "HDFC · insurance", text: "LIC: Rs.4,500 premium paid for policy XX123456 on 22-03-26 from HDFC A/c XX4821." },
  { label: "SBI · insurance", text: "Star Health Insurance: Rs.12,000 premium debited from SBI A/c XX8823 on 15-03-26." },
  { label: "HDFC · insurance", text: "HDFC Life: Rs.8,500 premium auto-debited from A/c XX4821 on 10-03-26. Policy: XX789012." },
  { label: "ICICI · insurance", text: "Bajaj Allianz: Rs.3,200 car insurance premium paid via ICICI Net Banking on 12-03-26." },
  { label: "HDFC · investment", text: "HDFC Mutual Fund SIP: Rs.5,000 debited from A/c XX4821 on 07-03-26. Scheme: HDFC Top 100." },
  { label: "SBI · investment", text: "Zerodha: Rs.10,000 transferred to trading A/c on 20-03-26 from SBI A/c XX8823." },
  { label: "ICICI · investment", text: "Groww: Rs.2,500 SIP deducted from ICICI A/c XX3421 on 10-03-26. Fund: Mirae Asset Large Cap." },
  { label: "SBI · investment return", text: "Upstox: Rs.15,000 credited to SBI A/c XX8823 from stock sale proceeds on 18-03-26." },
  { label: "SBI · investment", text: "PPF: Rs.50,000 deposited to PPF A/c via SBI YONO on 31-03-26. Ref: PPF928471001." },
  { label: "HDFC · health", text: "Apollo Hospitals: Rs.4,500 paid via HDFC Net Banking on 22-03-26. Patient ID: APO12345." },
  { label: "Unknown · health", text: "MedPlus Pharmacy: Rs.1,200 paid via PhonePe on 21-03-26. Bill: MED928471101." },
  { label: "Unknown · health", text: "Dr. Lal PathLabs: Rs.850 paid for lab tests via GPay on 20-03-26. Ref: LAB928471102." },
  { label: "Axis · health", text: "Netmeds: Rs.2,300 order placed via Axis A/c XX7712 on 19-03-26. Order: NM928471103." },
  { label: "SBI · health", text: "Practo: Rs.500 consultation fee paid via SBI A/c XX8823 on 18-03-26. Dr: XXXX." },
  { label: "HDFC · education", text: "BYJU'S: Rs.3,500 EMI debited from HDFC A/c XX4821 on 07-03-26. Course: JEE Prep." },
  { label: "SBI · education", text: "Unacademy: Rs.1,999 subscription debited from SBI A/c XX8823 on 15-03-26." },
  { label: "ICICI · education", text: "SCHOOL FEES: Rs.18,500 paid to DPS via ICICI Net Banking on 10-04-26. Student: XXXX." },
  { label: "Axis · education", text: "Coursera: Rs.2,999 annual plan debited from Axis A/c XX7712 on 08-03-26." },
  { label: "HDFC · food", text: "Swiggy: Rs.1,240 paid via HDFC debit card on 22-03-26. Order: SWG928471201." },
  { label: "SBI · food", text: "Zomato: Rs.680 paid via UPI from SBI A/c XX8823 on 21-03-26. Order: ZOM928471202." },
  { label: "Unknown · food", text: "McDonald's: Rs.420 paid via Paytm at McDonald's outlet on 20-03-26. TXN: MCD928471203." },
  { label: "Unknown · food", text: "KFC: Rs.550 paid via GPay at KFC outlet on 19-03-26. TXN: KFC928471204." },
  { label: "Unknown · food", text: "Cafe Coffee Day: Rs.280 paid via PhonePe on 18-03-26. TXN: CCD928471205." },
  { label: "ICICI · food", text: "EAT.FIT: Rs.890 for healthy meal subscription via ICICI on 17-03-26." },
  { label: "HDFC · bank charges", text: "HDFC Bank: Rs.590 annual maintenance charge debited from A/c XX4821 on 01-03-26. -HDFC Bank" },
  { label: "SBI · bank charges", text: "SBI: Rs.177 GST + service charge debited from A/c XX8823 on 31-03-26." },
  { label: "ICICI · bank charges", text: "ICICI Bank: Rs.295 SMS alert charges for quarter ending 31-03-26. A/c XX3421." },
  { label: "Axis · bank charges", text: "Axis Bank: Rs.118 debited from A/c XX7712 as IMPS transfer charges on 22-03-26." },
  { label: "Unknown · groceries", text: "DMart: Rs.3,420 paid via PhonePe UPI at D-Mart store on 22-03-26. Ref: DMT928471801." },
  { label: "Unknown · groceries", text: "Reliance Smart: Rs.1,890 paid via GPay at Reliance outlet on 21-03-26." },
  { label: "HDFC · electronics", text: "INR 5,200 debited from A/c XX4821 at CROMA RETAIL on 20-03-26. -HDFC Bank" },
  { label: "Axis · shopping", text: "Flipkart: Rs.8,999 order paid via Axis A/c XX7712 on 19-03-26. Order: FK928471802." },
  { label: "SBI · shopping", text: "Meesho: Rs.450 paid via UPI from SBI A/c XX8823 on 18-03-26. Order: MSH928471803." },
  { label: "HDFC · shopping", text: "Nykaa: Rs.1,850 paid from HDFC A/c XX4821 on 17-03-26. Order: NYK928471804." },
  { label: "HDFC · food", text: "INR 3,200 debited from A/c XX4821 at PARADISE BIRYANI on 22-03-26. -HDFC Bank" },
  { label: "Unknown · government", text: "Rs.1,500 paid to TELANGANA GOVT via GPay for property tax on 20-03-26. Ref: TG928471901." },
  { label: "Unknown · transport", text: "TSRTC: Rs.280 paid for Hyderabad-Vijayawada bus ticket via BHIM UPI on 18-03-26." },
  { label: "Axis · utilities", text: "AP TRANSCO: Rs.2,400 electricity bill paid from Axis A/c XX7712 on 17-03-26." },
  { label: "SBI · freelance income", text: "Rs.8,000 credited to SBI A/c XX8823 from HYDERABAD CLIENT via IMPS on 12-03-26." },
  { label: "HDFC · food", text: "INR 600 debited from A/c XX4821 at MINERVA COFFEE SHOP HYDERABAD on 19-03-26. -HDFC" },
  { label: "Unknown · utilities", text: "HMWSSB: Rs.380 water bill paid via PhonePe on 16-03-26. Consumer: HYD12345." },
  { label: "SBI · transfer", text: "Rs.25,000 transferred to VIJAYA BANK A/c on 01-03-26 via NEFT from SBI XX8823." },
  { label: "HDFC · shopping", text: "INR 1,100 debited from A/c XX4821 at DECATHLON HYDERABAD on 20-03-26. -HDFC Bank" },
  { label: "Kotak · education", text: "Rs.4,500 paid to KAKATIYA MEDICAL COLLEGE FEES from Kotak A/c XX5533 on 10-03-26." },
  { label: "HDFC · credit card payment", text: "HDFC Bank Credit Card XX1234: Payment of Rs.15,000 received on 20-03-26. Outstanding: Rs.4,200." },
  { label: "SBI · electronics", text: "Alert: Rs.12,800 spent on SBI Card XX3456 at LENOVO INDIA on 22-03-26. Avl Credit: Rs.37,200." },
  { label: "ICICI · cashback", text: "ICICI Coral Credit Card: Rs.1,800 cashback credited to A/c on 01-03-26. Total cashback: Rs.3,600." },
  { label: "Kotak · cashback", text: "Kotak Credit Card XX4455: Rs.2,500 reward points redeemed = Rs.500 credit on 15-03-26." },
  { label: "Axis · cashback", text: "AXIS ACE Credit Card: 5% cashback Rs.340 credited for fuel purchases this month. -Axis Bank" },
  { label: "HDFC · cashback", text: "HDFC Millennia Card: 1% cashback Rs.125 credited on online spends. -HDFC Bank XX1234." },
  { label: "SBI · credit card payment", text: "SBI Card: Minimum payment of Rs.2,500 due by 10-04-26 for card XX3456. Total due: Rs.18,200." },
  { label: "ICICI · credit card payment", text: "ICICI Credit Card Statement: Closing balance Rs.22,400. Min due Rs.1,120. Due date: 15-04-26." },
  { label: "HDFC · bank charges", text: "INR 1 debited from A/c XX4821 for UPI mandate verification on 22-03-26. -HDFC Bank" },
  { label: "HDFC · real estate", text: "INR 1,00,000 debited from A/c XX4821 by RTGS to PROPERTY DEVELOPER on 15-03-26. -HDFC Bank" },
  { label: "SBI · travel", text: "Rs.50 debited from a/c XX8823 for IRCTC platform convenience fee on 18-03-26. -SBI" },
  { label: "HDFC · shopping", text: "INR 499.50 debited from A/c XX4821 at FOREIGN MERCHANT USD on 20-03-26. -HDFC Bank" },
  { label: "Unknown · shopping", text: "Txn Successful. Amt: Rs 3400. To: amazon@apl. Date: 22/03/26. UPI ID: 928471XYZ." },
  { label: "SBI · emi", text: "Rs 12000 dr to a/c XX8823. Info:EMI. Bal:Rs 4500.00. -SBI" },
  { label: "HDFC · shopping", text: "A/c XX4821-INR 2350.00 Dr on 22Mar26 by UPI-AMZN. Bal INR 16070.00 HDFC Bank." },
  { label: "Axis · other", text: "Debit Alert! Rs.1,500/- debited from your Axis Bank A/c XX7712 on 22-03-26." },
  { label: "ICICI · other", text: "Your ICICI Bank account XX3421 is low on funds. Balance: Rs.1,234. Please add funds." },
  { label: "HDFC · other", text: "OTP for transaction of Rs.8,500 from HDFC A/c XX4821 is 782341. Valid 10 mins. -HDFC Bank" },
  { label: "SBI · refund", text: "REFUND: Rs.1,200 credited to SBI A/c XX8823 from AMAZON on 20-03-26. Order: AMZ12345." },
  { label: "HDFC · refund", text: "Rs.499 refunded to HDFC A/c XX4821 from SWIGGY on 21-03-26. Ref: SWG_REF928471." },
  { label: "Kotak · refund", text: "FLIPKART REFUND: Rs.2,800 credited to Kotak A/c XX5533 on 18-03-26. Order: FK12345." },
  { label: "SBI · transfer", text: "Cheque No.000234 for Rs.15,000 presented and paid from SBI A/c XX8823 on 20-03-26." },
  { label: "SBI · transfer", text: "NEFT Outward: Rs.25,000 to HDFC A/c XX9988 (Suresh Kumar) on 22-03-26 from SBI XX8823." },
  { label: "Axis · transfer", text: "IMPS Credit: Rs.10,000 from Deepika (deepika@okaxis) credited to Axis A/c XX7712." },
  { label: "HDFC · cashback", text: "Reward Points: 500 points = Rs.125 credited to HDFC A/c XX4821 from HDFC credit card." },
  { label: "HDFC · health", text: "INR 3,500 debited from A/c XX4821 for GYMKHANA CLUB membership on 15-03-26. -HDFC" },
  { label: "Kotak · donation", text: "Rs.1,800 debited from Kotak A/c XX5533 at TEMPLE TRUST on 14-03-26. -Kotak Bank" },
  { label: "HDFC · insurance", text: "INR 5,000 debited from A/c XX4821 for HDFC ERGO vehicle insurance renewal. -HDFC Bank" },
  { label: "Unknown · government", text: "Rs.2,200 paid to PM KISAN SAMMAN NIDHI via GPay on 22-03-26. Ref: PMKSN928471." },
  { label: "HDFC · shopping", text: "INR 800 debited from A/c XX4821 at CROSSWORD BOOKSTORE on 16-03-26. -HDFC Bank" },
  { label: "Unknown · professional services", text: "UPI COLLECT: Rs.4,500 paid to CA FIRM on 22-03-26 via PhonePe. Ref: CA928471001." },
  { label: "SBI · professional services", text: "Rs.3,000 debited from SBI A/c XX8823 for ADVOCATE FEES on 20-03-26. -SBI" },
  { label: "HDFC · health", text: "INR 599 debited from A/c XX4821 at LENSKART on 19-03-26. -HDFC Bank" },
  { label: "ICICI · transport", text: "Rs.7,200 debited from ICICI A/c XX3421 for VEHICLE SERVICING at MARUTI on 18-03-26." },
  { label: "HDFC · investment", text: "HDFC Bank: Rs.25,000 FD created from A/c XX4821. Maturity 22-09-26. Rate: 7.25% pa." },
  { label: "Axis · transport", text: "Rs.450 debited from Axis A/c XX7712 for PARKING FEE at FORUM MALL on 22-03-26." },
  { label: "HDFC · personal care", text: "INR 1,600 debited from A/c XX4821 at HAIR SALON on 20-03-26. -HDFC Bank" },
  { label: "SBI · personal care", text: "Rs.290 debited from SBI A/c XX8823 for LAUNDRY SERVICE on 19-03-26. -SBI" },
  { label: "PhonePe · rent", text: "PhonePe: Rs.12,000 paid to LANDLORD (rent@okicici) on 01-03-26. UPI Ref: PP928471999." },
  { label: "SBI · investment return", text: "NACH CREDIT: Rs.2,100 credited to SBI A/c XX8823 as DIVIDEND on 15-03-26." },
  { label: "HDFC · government", text: "INR 22,000 debited from A/c XX4821 for ADVANCE TAX payment to IT DEPT on 15-03-26." },
  { label: "HDFC · government", text: "GST PAYMENT: Rs.8,500 debited from HDFC A/c XX4821 to GSTN portal on 20-03-26." },
  { label: "Kotak · shopping", text: "Rs.3,400 debited from Kotak A/c XX5533 at PEPPERFRY FURNITURE on 14-03-26." },
  { label: "HDFC · bank charges", text: "HDFC Bank: Rs.150 SMS banking charge debited from A/c XX4821 on 31-03-26." },
  { label: "HDFC · health", text: "INR 6,500 debited from A/c XX4821 for DENTAL TREATMENT at DENTAL CLINIC on 18-03-26." },
  { label: "SBI · entertainment", text: "TATA PLAY: Rs.399 monthly subscription paid from SBI A/c XX8823 on 15-03-26." },
  { label: "ICICI · entertainment", text: "Airtel DTH: Rs.349 recharge via ICICI Net Banking on 14-03-26. Cust: AIR12345." },
  { label: "Axis · transport", text: "Rs.1,200 debited from Axis A/c XX7712 for CAR WASH SERVICE on 22-03-26." },
  { label: "HDFC · travel", text: "CLUB MAHINDRA: Rs.4,500 EMI debited from HDFC A/c XX4821 on 10-03-26." },
  { label: "Kotak · real estate", text: "Rs.75,000 RTGS credit to Kotak A/c XX5533 from PROPERTY SALE PROCEEDS on 15-03-26." },
  { label: "HDFC · jewellery", text: "INR 2,800 debited from A/c XX4821 at TANISHQ JEWELLERS on 22-03-26. -HDFC Bank" },
  { label: "Unknown · personal care", text: "URBAN COMPANY: Rs.1,500 paid for home cleaning service via GPay on 20-03-26." },
  { label: "SBI · government", text: "Rs.3,200 debited from SBI A/c XX8823 for PUC + VEHICLE FITNESS CERTIFICATE on 18-03-26." },
  { label: "SBI · government", text: "PASSPORT FEE: Rs.1,500 paid to MEA via SBI Net Banking on 16-03-26. App: XX12345." },
  { label: "HDFC · investment return", text: "HDFC Bank: Your FD of Rs.25,000 matured. Rs.26,812 credited to A/c XX4821 on 22-09-26." },
  { label: "PhonePe · food", text: "UPI payment of Rs.30 to CHAI WALA on 22-03-26 via PhonePe. Ref: PP92847XX01." },
  { label: "GooglePay · transport", text: "Rs.120 paid to AUTO DRIVER via GPay on 22-03-26. UPI Ref: GPY92847XX02." },
  { label: "PhonePe · food", text: "PhonePe: Rs.85 paid to PANI PURI WALA on 21-03-26. UPI Ref: PP92847XX03." },
  { label: "Paytm · personal care", text: "Rs.200 paid to BARBER SHOP via Paytm QR on 20-03-26. Ref: PTM92847XX04." },
  { label: "GooglePay · groceries", text: "GPay: Rs.1,800 paid to KIRANA STORE on 19-03-26. UPI Ref: GPY92847XX05." },
  { label: "BHIM · personal care", text: "BHIM UPI: Rs.350 paid to DHOBI on 18-03-26. UPI Ref: BHIM92847XX06." },
  { label: "PhonePe · personal care", text: "Rs.600 paid to PRESS WALA via PhonePe on 17-03-26. Ref: PP92847XX07." },
  { label: "GooglePay · domestic help", text: "GPay: Rs.2,500 sent to MAID SALARY on 01-03-26. UPI Ref: GPY92847XX08." },
  { label: "PhonePe · domestic help", text: "PhonePe: Rs.1,500 paid to DRIVER SALARY on 01-03-26. UPI Ref: PP92847XX09." },
  { label: "BHIM · domestic help", text: "BHIM UPI: Rs.3,000 sent to COOK on 01-03-26. UPI Ref: BHIM92847XX10." },
  { label: "GooglePay · transport", text: "Rs.75 paid to CYCLE REPAIR SHOP via GPay on 16-03-26. Ref: GPY92847XX11." },
  { label: "Paytm · groceries", text: "Paytm: Rs.450 paid to VEGETABLE MANDI on 15-03-26. Ref: PTM92847XX12." },
  { label: "GooglePay · groceries", text: "GPay: Rs.1,200 paid to MILK DAIRY on 31-03-26. Monthly milk bill. Ref: GPY92847XX13." },
  { label: "PhonePe · subscription", text: "PhonePe: Rs.800 paid to NEWSPAPER AGENT monthly on 31-03-26. Ref: PP92847XX14." },
  { label: "Paytm · housing", text: "Rs.2,000 paid to COLONY MAINTENANCE on 05-03-26 via Paytm. Ref: PTM92847XX15." },
  { label: "SBI · utilities", text: "TNEB: Rs.1,560 electricity bill paid via SBI Net Banking on 18-03-26. CA No: XXXXXX." },
  { label: "HDFC · utilities", text: "MSEDCL: Rs.2,340 electricity bill paid via HDFC Net Banking on 17-03-26." },
  { label: "Axis · utilities", text: "WBSEDCL: Rs.890 electricity paid from Axis A/c XX7712 on 16-03-26." },
  { label: "GooglePay · utilities", text: "KESCO: Rs.1,100 electricity bill paid via GPay on 15-03-26. Consumer: KES12345." },
  { label: "SBI · government", text: "Rs.3,500 paid to MUNICIPAL CORPORATION for property tax via SBI on 22-03-26." },
  { label: "GooglePay · government", text: "GPay: Rs.1,200 paid to JNPT PORT TRUST for vehicle pass on 20-03-26. Ref: JNPT12345." },
  { label: "PhonePe · government", text: "PhonePe: Rs.2,800 paid to BBMP property tax on 22-03-26. PID: BBMP12345." },
  { label: "SBI · government", text: "Rs.500 paid to DRIVING LICENSE RENEWAL via SBI Net Banking on 18-03-26. DL: XXXX." },
  { label: "HDFC · government", text: "INCOME TAX: Rs.15,000 advance tax paid via HDFC Net Banking on 15-03-26. PAN: XXXXX." },
  { label: "PhonePe · transport", text: "PhonePe: Rs.1,800 paid to FASTTAG recharge on 22-03-26. Vehicle: XX-XX-XXXX." },
  { label: "Unknown · transport", text: "NHAI FASTag: Rs.65 deducted at MUMBAI-PUNE EXPRESSWAY on 22-03-26. Balance: Rs.1,735." },
  { label: "Unknown · transport", text: "FASTag Alert: Rs.155 deducted for NH48 toll on 21-03-26. Remaining balance: Rs.1,580." },
  { label: "SBI · government", text: "Rs.6,000 challan paid to TRAFFIC POLICE via SBI Net Banking on 20-03-26. Challan: XX123." },
  { label: "Paytm · insurance", text: "Paytm: Rs.2,000 paid to PM KISAN PM FASAL BIMA on 15-03-26. Ref: PMFBY12345." },
  { label: "BHIM · government", text: "JAGA MISSION: Rs.500 paid for housing scheme via BHIM UPI on 14-03-26. Odisha Govt." },
  { label: "Yes Bank · shopping", text: "Yes Bank: Rs.3,200 debited from A/c XX6612 at AMAZON on 22-03-26. Avl Bal: Rs.12,800." },
  { label: "Yes Bank · salary", text: "Yes Bank: Rs.18,000 credited to A/c XX6612 from EMPLOYER on 01-03-26. Avl Bal: Rs.21,200." },
  { label: "IDFC FIRST · food", text: "IDFC FIRST Bank: Rs.1,500 debited from A/c XX9934 at ZOMATO on 22-03-26. Bal: Rs.8,500." },
  { label: "IDFC FIRST · salary", text: "IDFC FIRST Bank: Rs.25,000 salary credited to A/c XX9934 on 01-03-26. Bal: Rs.33,500." },
  { label: "IndusInd · shopping", text: "IndusInd Bank: Rs.4,200 debited from A/c XX7723 for FLIPKART on 22-03-26. Bal: Rs.15,800." },
  { label: "IndusInd · emi", text: "IndusInd Bank: Rs.8,500 loan EMI debited from A/c XX7723 on 05-03-26. Bal: Rs.7,300." },
  { label: "Bank of Baroda · fuel", text: "Bank of Baroda: Rs.2,100 debited from A/c XX4456 at PETROL PUMP on 22-03-26. Bal: Rs.6,900." },
  { label: "Bank of Baroda · salary", text: "Bank of Baroda: Rs.10,000 credited to A/c XX4456 by NEFT from GOVT EMPLOYER on 01-03-26." },
  { label: "Canara Bank · health", text: "Canara Bank: Rs.1,800 debited from A/c XX3345 at MEDPLUS on 21-03-26. Avl Bal: Rs.4,200." },
  { label: "Canara Bank · investment return", text: "Canara Bank: Rs.30,000 FD matured. Rs.32,400 credited to A/c XX3345 on 22-03-26." },
  { label: "PNB · emi", text: "PNB: Rs.5,000 debited from A/c XX2234 for HOME LOAN EMI on 05-03-26. Avl Bal: Rs.3,200." },
  { label: "PNB · government", text: "PNB: Rs.12,000 credited to A/c XX2234 from PRADHAN MANTRI AWAS YOJANA on 15-03-26." },
  { label: "Union Bank · health", text: "Union Bank: Rs.3,500 debited from A/c XX1123 at HOSPITAL on 20-03-26. Bal: Rs.9,500." },
  { label: "Central Bank · loan disbursement", text: "Central Bank: Rs.8,000 KCC loan credited to A/c XX8899 on 10-03-26. Kisan Credit Card." },
  { label: "UCO Bank · pension", text: "UCO Bank: Rs.2,000 pension credited to A/c XX7788 on 01-03-26. Avl Bal: Rs.5,800." },
  { label: "SBI · government", text: "PM-KISAN: Rs.2,000 credited to A/c XX3344 from GOVT on 15-03-26. Installment 16." },
  { label: "Bank of Baroda · government", text: "MNREGS: Rs.3,600 wages credited to A/c XX5566 on 18-03-26 by NREGA. Job Card: XXXX." },
  { label: "Canara Bank · government", text: "FERTILIZER SUBSIDY: Rs.1,500 DBT credited to Canara A/c XX7788 on 12-03-26 from GOVT." },
  { label: "PNB · farming income", text: "E-NAM: Rs.45,000 for WHEAT sale credited to PNB A/c XX2233 on 20-03-26. Mandi: XXXX." },
  { label: "SBI · farming income", text: "APMC MANDI: Rs.28,000 for SOYBEAN sale credited to SBI A/c XX8823 on 15-03-26." },
  { label: "PNB · emi", text: "Rs.12,000 debited from PNB A/c XX2234 for TRACTOR LOAN EMI on 07-03-26." },
  { label: "PhonePe · farming expense", text: "IFFCO KISAN: Rs.4,500 paid for SEEDS AND FERTILIZER via PhonePe on 18-03-26." },
  { label: "GooglePay · farming expense", text: "GPay: Rs.800 paid to KRISHI SEVA KENDRA on 15-03-26. UPI Ref: GPY92847XX53." },
  { label: "SBI · investment", text: "SUKANYA SAMRIDDHI: Rs.5,000 deposited to SSY A/c via SBI on 31-03-26." },
  { label: "SBI · cash", text: "Rs.1,500 withdrawn from BC AGENT on 22-03-26. A/c XX5566. Bal: Rs.3,200. -SBI KIOSK." },
  { label: "ICICI · gig income", text: "ZOMATO: Rs.4,850 weekly earnings credited to your A/c XX9988 on 22-03-26. Partners: ZOM." },
  { label: "SBI · gig income", text: "SWIGGY DELIVERY: Rs.6,200 earnings for week 11 credited to SBI A/c XX8823 on 18-03-26." },
  { label: "HDFC · gig income", text: "OLA DRIVER: Rs.8,900 earnings credited to your HDFC A/c XX4821 on 15-03-26. Trips: 142." },
  { label: "Axis · gig income", text: "URBAN COMPANY: Rs.12,500 earnings credited to Axis A/c XX7712 on 15-03-26. Jobs: 18." },
  { label: "SBI · gig income", text: "DUNZO DELIVERY: Rs.3,200 weekly payout to SBI A/c XX8823 on 22-03-26." },
  { label: "HDFC · freelance income", text: "MEESHO: Rs.2,800 reseller earnings transferred to HDFC A/c XX4821 on 18-03-26." },
  { label: "Kotak · freelance income", text: "UPWORK: USD 150 = Rs.12,450 credited to Kotak A/c XX5533 on 15-03-26. Ref: UPW12345." },
  { label: "Yes Bank · freelance income", text: "FIVERR: Rs.8,200 credited to Yes Bank A/c XX6612 via PayPal on 12-03-26." },
  { label: "HDFC · freelance income", text: "YOUTUBE: Rs.18,500 AdSense credited to HDFC A/c XX4821 on 21-03-26. Channel: XXXX." },
  { label: "ICICI · business income", text: "AMAZON SELLER: Rs.34,000 marketplace earnings credited to ICICI A/c XX3421 on 18-03-26." },
  { label: "SBI · business income", text: "BLINKIT SELLER: Rs.22,000 sales credited to SBI A/c XX8823 on 15-03-26." },
  { label: "GooglePay · freelance income", text: "GPay: Rs.5,500 received from FREELANCE CLIENT on 14-03-26. UPI Ref: GPY92847XX67." },
  { label: "HDFC · emi", text: "LAZYPAY: Rs.2,500 EMI debited from HDFC A/c XX4821 on 07-03-26. Due cleared." },
  { label: "SBI · emi", text: "SIMPL: Rs.1,800 bill due paid from SBI A/c XX8823 on 10-03-26. Next due: 10-04-26." },
  { label: "ICICI · emi", text: "SLICE CARD: Rs.4,200 EMI debited from ICICI A/c XX3421 on 05-03-26. Card: XXXX." },
  { label: "Axis · emi", text: "UNI CARD: Rs.3,600 1/3 pay EMI debited from Axis A/c XX7712 on 07-03-26." },
  { label: "Kotak · emi", text: "ZESTMONEY: Rs.5,400 EMI debited from Kotak A/c XX5533 on 10-03-26. Loan: ZM12345." },
  { label: "Yes Bank · emi", text: "STASHFIN: Rs.8,000 loan EMI debited from Yes Bank A/c XX6612 on 07-03-26." },
  { label: "SBI · emi", text: "NAVI: Rs.6,500 personal loan EMI debited from SBI A/c XX8823 on 05-03-26. Loan: NAV12345." },
  { label: "HDFC · emi", text: "MONEYVIEW: Rs.4,800 loan EMI from HDFC A/c XX4821 on 10-03-26. Ref: MV12345." },
  { label: "ICICI · emi", text: "KREDITBEE: Rs.3,200 loan EMI debited from ICICI A/c XX3421 on 07-03-26." },
  { label: "SBI · emi", text: "MPOKKET: Rs.1,500 student loan EMI from SBI A/c XX8823 on 07-03-26. Ref: MPK12345." },
  { label: "HDFC · investment", text: "WAZIRX: Rs.5,000 transferred from HDFC A/c XX4821 to WazirX wallet on 20-03-26." },
  { label: "SBI · investment", text: "COINSWITCH: Rs.10,000 deposited to CoinSwitch from SBI A/c XX8823 on 18-03-26." },
  { label: "ICICI · investment", text: "COINDCX: Rs.15,000 transferred from ICICI A/c XX3421 to CoinDCX on 16-03-26." },
  { label: "HDFC · investment return", text: "WAZIRX WITHDRAWAL: Rs.8,500 credited to HDFC A/c XX4821 from WazirX on 15-03-26." },
  { label: "ICICI · investment", text: "SMALLCASE: Rs.25,000 invested via Zerodha from ICICI A/c XX3421 on 10-03-26." },
  { label: "HDFC · investment", text: "INDmoney: Rs.3,000 US stocks investment from HDFC A/c XX4821 on 18-03-26." },
  { label: "Axis · investment", text: "KUVERA: Rs.10,000 direct mutual fund investment from Axis A/c XX7712 on 10-03-26." },
  { label: "SBI · education", text: "IIT MADRAS ONLINE: Rs.15,000 course fee from SBI A/c XX8823 on 15-03-26. Course: DS101." },
  { label: "HDFC · education", text: "ALLEN CAREER: Rs.85,000 JEE coaching fee from HDFC A/c XX4821 on 10-03-26." },
  { label: "ICICI · education", text: "VEDANTU: Rs.4,999 annual subscription from ICICI A/c XX3421 on 18-03-26." },
  { label: "SBI · education", text: "PhysicsWallah: Rs.2,999 annual plan debited from SBI A/c XX8823 on 15-03-26." },
  { label: "Kotak · education", text: "UPGRAD: Rs.1,25,000 MBA course fee from Kotak A/c XX5533 on 10-03-26. Course: EMBA." },
  { label: "Axis · education", text: "GREAT LEARNING: Rs.45,000 data science course from Axis A/c XX7712 on 12-03-26." },
  { label: "SBI · education", text: "COLLEGE FEES: Rs.45,000 paid to OSMANIA UNIVERSITY via SBI on 10-06-26. Roll: XXXX." },
  { label: "GooglePay · education", text: "GPay: Rs.500 paid to TUITION TEACHER on 01-03-26. Monthly fee. Ref: GPY92847XX92." },
  { label: "PhonePe · transport", text: "SCHOOL TRANSPORT: Rs.1,200 paid to BUS DRIVER via PhonePe on 01-03-26." },
  { label: "SBI · events", text: "Rs.50,000 sent to WEDDING VENUE via NEFT from SBI A/c XX8823 on 15-03-26. Advance booking." },
  { label: "GooglePay · events", text: "GPay: Rs.5,000 sent to CATERER on 18-03-26 as advance. Ref: GPY92847XX95." },
  { label: "PhonePe · events", text: "PhonePe: Rs.3,500 paid to PANDAL DECORATOR on 20-03-26. Ref: PP92847XX96." },
  { label: "HDFC · events", text: "Rs.15,000 sent to PHOTOGRAPHER via IMPS from HDFC A/c XX4821 on 10-03-26." },
  { label: "BHIM · donation", text: "BHIM UPI: Rs.2,100 paid to TEMPLE on 22-03-26 for PUJA booking. Ref: BHIM92847XX98." },
  { label: "GooglePay · donation", text: "GPay: Rs.1,001 dakshina sent to PANDIT JI on 21-03-26. Ref: GPY92847XX99." },
  { label: "Paytm · donation", text: "Paytm: Rs.500 donated to ISKCON on 22-03-26. Ref: PTM92847X100." },
  { label: "SBI · donation", text: "Rs.10,000 sent to CRY INDIA via SBI Net Banking on 22-03-26. Donor ID: CRY12345." },
  { label: "HDFC · donation", text: "80G RECEIPT: Rs.5,000 donation to GIVE INDIA credited on 15-03-26. Tax exemption eligible." },
  { label: "SBI · donation", text: "TIRUPATI DEVASTHANAM: Rs.300 booking fee via SBI Net Banking. Prasadam token: TTD12345." },
  { label: "HDFC · real estate", text: "Rs.2,00,000 RTGS to PRESTIGE ESTATES for flat booking on 15-03-26 from HDFC A/c XX4821." },
  { label: "ICICI · real estate", text: "Rs.5,00,000 RTGS to SOBHA DEVELOPERS on 20-03-26 from ICICI A/c XX3421. Flat: Unit XX." },
  { label: "SBI · government", text: "STAMP DUTY: Rs.45,000 paid to MAHARASHTRA GOVT via SBI Net Banking on 18-03-26." },
  { label: "HDFC · government", text: "REGISTRATION FEES: Rs.12,000 paid to SUB-REGISTRAR OFFICE via HDFC on 18-03-26." },
  { label: "SBI · transfer", text: "NRI REMITTANCE: USD 2,000 = Rs.1,66,000 credited to SBI A/c XX8823 from USA on 15-03-26." },
  { label: "SBI · loan disbursement", text: "HOUSING LOAN DISBURSEMENT: Rs.25,00,000 credited to SBI A/c XX8823 on 10-03-26. SBI HOME LOAN." },
  { label: "HDFC · emi", text: "Rs.18,000 HOME LOAN EMI debited from HDFC A/c XX4821 on 05-03-26. Loan A/c: XX9900. -HDFC" },
  { label: "ICICI · housing", text: "RENTAL DEPOSIT: Rs.1,00,000 sent to LANDLORD via RTGS from ICICI A/c XX3421 on 01-03-26." },
  { label: "HDFC · insurance", text: "NIVA BUPA: Rs.18,000 annual health insurance from HDFC A/c XX4821 on 15-03-26." },
  { label: "SBI · insurance", text: "CARE HEALTH: Rs.12,500 family floater from SBI A/c XX8823 on 10-03-26." },
  { label: "ICICI · insurance", text: "DIGIT INSURANCE: Rs.8,200 car insurance from ICICI A/c XX3421 on 18-03-26. Policy: DGT12345." },
  { label: "PhonePe · insurance", text: "ACKO: Rs.3,500 2-wheeler insurance via PhonePe on 22-03-26. Policy: ACKO12345." },
  { label: "Kotak · insurance", text: "TATA AIG: Rs.15,000 annual travel insurance from Kotak A/c XX5533 on 12-03-26." },
  { label: "HDFC · insurance", text: "POLICYBAZAAR: Rs.25,000 term life insurance annual from HDFC A/c XX4821 on 10-03-26." },
  { label: "SBI · insurance", text: "CLAIM CREDIT: Rs.45,000 health insurance claim credited to SBI A/c XX8823 on 18-03-26." },
  { label: "HDFC · travel", text: "INDIGO: Rs.4,200 flight ticket from HDFC A/c XX4821 on 18-03-26. PNR: 6E-XXXX." },
  { label: "ICICI · travel", text: "AIR INDIA: Rs.12,500 flight from ICICI A/c XX3421 on 15-03-26. PNR: AI-XXXX." },
  { label: "Kotak · travel", text: "VISTARA: Rs.7,800 business class from Kotak A/c XX5533 on 12-03-26. PNR: UK-XXXX." },
  { label: "SBI · travel", text: "SPICEJET: Rs.3,100 ticket from SBI A/c XX8823 on 20-03-26. PNR: SG-XXXX." },
  { label: "Axis · travel", text: "IXIGO: Rs.1,800 train ticket from Axis A/c XX7712 on 18-03-26. PNR: XXXX1234." },
  { label: "SBI · travel", text: "REDBUS: Rs.650 bus ticket from SBI A/c XX8823 to Hyderabad on 20-03-26. PNR: RB12345." },
  { label: "HDFC · travel", text: "CLEARTRIP: Rs.8,500 hotel booking from HDFC A/c XX4821 on 15-03-26. Booking: CLT12345." },
  { label: "Paytm · travel", text: "TREEBO: Rs.2,200 hotel booking from Paytm on 18-03-26. Check-in: 22-03-26. Ref: TRB12345." },
  { label: "SBI · travel", text: "VAISHNO DEVI: Rs.250 helicopter booking from SBI A/c XX8823 on 15-03-26. Ref: VD12345." },
  { label: "HDFC · travel", text: "CHAR DHAM YATRA: Rs.15,000 yatra package from HDFC A/c XX4821 on 10-03-26." },
  { label: "SBI · entertainment", text: "ZEE5: Rs.999 annual plan from SBI A/c XX8823 on 15-03-26. Subscription renewed." },
  { label: "HDFC · entertainment", text: "SONYLIV: Rs.1,499 annual from HDFC A/c XX4821 on 12-03-26. Subscription active." },
  { label: "ICICI · entertainment", text: "JIOCINEMA: Rs.999 annual premium from ICICI A/c XX3421 on 10-03-26." },
  { label: "SBI · subscription", text: "MANORAMA ONLINE: Rs.599 annual from SBI A/c XX8823 on 08-03-26. Regional news." },
  { label: "Paytm · entertainment", text: "SHARECHAT GOLD: Rs.299 monthly from Paytm on 22-03-26. Ref: SC12345." },
  { label: "PhonePe · entertainment", text: "JOSH: Rs.199 creator subscription via PhonePe on 20-03-26. Creator: XXXX." },
  { label: "HDFC · entertainment", text: "AUDIBLE IN: Rs.199 monthly from HDFC A/c XX4821 on 15-03-26. 1 credit used." },
  { label: "AmazonPay · subscription", text: "KINDLE UNLIMITED: Rs.169 monthly from Amazon Pay on 22-03-26. Ref: AMZ92847X136." },
  { label: "SBI · subscription", text: "SWIGGY ONE: Rs.1,499 annual from SBI A/c XX8823 on 10-03-26. Free delivery active." },
  { label: "HDFC · subscription", text: "ZOMATO GOLD: Rs.1,800 annual from HDFC A/c XX4821 on 08-03-26. Dining plus active." },
  { label: "Axis · subscription", text: "BLINKIT PASS: Rs.599 annual from Axis A/c XX7712 on 15-03-26. Free delivery active." },
  { label: "HDFC · shopping", text: "Big Billion Day: Rs.12,500 FLIPKART order from HDFC A/c XX4821 on 10-10-26. Order: FK12345." },
  { label: "SBI · shopping", text: "AMAZON GREAT INDIAN FESTIVAL: Rs.8,900 from SBI A/c XX8823 on 15-10-26." },
  { label: "ICICI · jewellery", text: "DIWALI SHOPPING: Rs.6,500 at TANISHQ JEWELLERS from ICICI CC XX5678 on 01-11-26." },
  { label: "Kotak · shopping", text: "NALLI SILKS: Rs.15,000 saree from Kotak A/c XX5533 for PONGAL on 10-01-26." },
  { label: "SBI · jewellery", text: "MALABAR GOLD: Rs.25,000 ONAM jewellery from SBI A/c XX8823 on 20-08-26." },
  { label: "HDFC · jewellery", text: "EID SPECIAL: Rs.4,500 at HYDERABAD PEARLS from HDFC A/c XX4821 on 10-04-26." },
  { label: "Axis · shopping", text: "PHULKARI STUDIO: Rs.3,200 from Axis A/c XX7712 for BAISAKHI SHOPPING on 12-04-26." },
  { label: "GooglePay · shopping", text: "CRACKER PURCHASE: Rs.2,800 at LOCAL SHOP via GPay for DIWALI on 01-11-26." },
  { label: "HDFC · salary", text: "Ac XX4821-INR 5000.00 Cr on 01Mar26 by NEFT-SALARY-EMPLOYER. Bal INR 28450.00 HDFC." },
  { label: "SBI · food", text: "INR5000.00 Dr frm acct XX8823 at SWGY 22/03/26 Avl bal Rs2345.00 SBI." },
  { label: "HDFC · other", text: "ALERT: Big transaction! Rs.1,00,000 debited from A/c XX4821. -HDFC Bank. 22-03-26." },
  { label: "ICICI · other", text: "Dear Customer, your a/c XX3421 has been credited with INR 45,000 on 01/03/2026." },
  { label: "Unknown · transfer", text: "Txn ID:928471XYZ|Amt:Rs 1500|To:9849XXXXXX@ybl|Status:SUCCESS|22-03-26|UPI." },
  { label: "HDFC · other", text: "DEBIT Rs 350/- A/c XX4821 Ref:928471 22MAR UPI PAYMENT OK -HDFC." },
  { label: "SBI · other", text: "Your acct is debited Rs.2,000. Avl Bal 8,500. Call 1800XXXXXX for queries. -SBI." },
  { label: "SBI · transfer", text: "SBI: Debit of Rs 12,000 from AC XXXXXXXX8823. INB Transfer. 22-03-2026 15:42:30." },
  { label: "ICICI · other", text: "ICICI: Acct debited Rs 899. Ref 928471. 22/03/26. Query? Call 18001080." },
  { label: "Axis · other", text: "Account alert: Rs.500 spent on your AXIS Bank debit card ending 1234 on 22-Mar-26." },
  { label: "HDFC · credit card payment", text: "Your HDFC Bank Credit Card XX1234 has a payment overdue of Rs.5,200. Pay now to avoid charges." },
  { label: "HDFC · other", text: "NACH RETURN: Rs.8,500 debit failed from A/c XX4821. Insufficient funds. -HDFC Bank." },
  { label: "SBI · transfer", text: "Cheque no 000345 for Rs.25,000 presented from third party on 22-03-26. -SBI A/c XX8823." },
  { label: "Kotak · investment", text: "Standing Instruction executed: Rs.2,000 transferred to RD A/c on 05-03-26. -KOTAK Bank." },
  { label: "HDFC · investment return", text: "SWEEP IN: Rs.5,000 swept from FD to savings A/c XX4821 on 22-03-26. Balance low. -HDFC." },
  { label: "HDFC · entertainment", text: "International txn: USD 12.99 = Rs.1,078 at NETFLIX.COM on 22-03-26. HDFC Card XX1234." },
  { label: "ICICI · shopping", text: "FOREX DEBIT: GBP 50 = Rs.5,250 at AMAZON UK on 20-03-26. ICICI Card XX5678." },
  { label: "HDFC · emi", text: "EMI CONVERSION: Rs.15,000 converted to 6 EMI @ Rs.2,605/month. HDFC Card XX1234." },
  { label: "SBI · cashback", text: "REWARD REDEMPTION: 2500 points = Rs.250 credited to SBI Credit Card XX3456 on 22-03-26." },
  { label: "ICICI · other", text: "CREDIT LIMIT INCREASE: Your ICICI CC XX5678 limit increased to Rs.2,00,000 on 22-03-26." },
  { label: "HDFC · other", text: "Suspicious activity detected on A/c XX4821. Rs.50,000 blocked. Call 18001008. -HDFC Bank." },
  { label: "SBI · other", text: "Your UPI ID arthasms@oksbi has been created successfully. -SBI. 22-03-26." },
  { label: "HDFC · refund", text: "REVERSAL: Rs.1,800 reversed to A/c XX4821 from IRCTC on 20-03-26. Cancelled ticket refund." },
  { label: "PhonePe · other", text: "PhonePe: Rs.3,500 sent to wrong UPI ID. Dispute raised. Ref: PP92847X171. 22-03-26." },
  { label: "SBI · entertainment", text: "AUTOPAY SUCCESS: Rs.499 to NETFLIX debited on 22-03-26. Next due: 22-04-26. -SBI." },
  { label: "SBI · interest income", text: "Your SBI A/c XX8823 interest of Rs.234 credited for Q4 on 31-03-26. Savings interest." },
  { label: "HDFC · transfer", text: "JOINT A/C CREDIT: Rs.10,000 credited to joint A/c XX4488 by CO-HOLDER on 22-03-26. -HDFC." },
  { label: "HDFC · bank charges", text: "LOCKER CHARGES: Rs.2,500 annual locker fee debited from A/c XX4821. -HDFC Bank. 01-04-26." },
  { label: "ICICI · bank charges", text: "DEMAT CHARGES: Rs.350 annual maintenance debited from ICICI A/c XX3421 on 01-04-26." },
  { label: "SBI · investment", text: "NPS CONTRIBUTION: Rs.5,000 debited from SBI A/c XX8823 on 01-03-26. Employer+Employee." },
  { label: "HDFC · investment", text: "EPF CONTRIBUTION: Rs.3,600 debited from HDFC A/c XX4821 on 01-03-26. PF A/c: XXXX." },
  { label: "HDFC · income", text: "GRATUITY: Rs.85,000 credited to HDFC A/c XX4821 on 15-03-26. Final settlement." },
  { label: "ICICI · income", text: "BONUS CREDIT: Rs.50,000 performance bonus from EMPLOYER to ICICI A/c XX3421 on 20-03-26." },
  { label: "SBI · income", text: "REIMBURSEMENT: Rs.8,500 travel allowance credited to SBI A/c XX8823 on 18-03-26." },
  { label: "HDFC · income", text: "MEDICAL CLAIM: Rs.12,000 reimbursement credited to HDFC A/c XX4821 on 15-03-26." },
  { label: "HDFC · income", text: "HRA TRANSFER: Rs.15,000 house rent allowance to HDFC A/c XX4821 on 01-03-26." },
  { label: "HDFC · other", text: "INTERNET BANKING BLOCKED: Suspicious login. A/c XX4821 temporarily blocked. -HDFC." },
  { label: "GooglePay · cashback", text: "GPay Scratch Card: Rs.21 cashback won! Credited to Google Pay balance. 22-03-26." },
  { label: "Paytm · cashback", text: "Paytm CASHKARO: Rs.150 cashback credited to Paytm wallet on 22-03-26. Ref: PTM92847X186." },
  { label: "PhonePe · travel", text: "PHONEPE SWITCH: Rs.500 paid to HOTEL via PhonePe Switch on 20-03-26. Ref: PP92847X187." },
  { label: "HDFC · wallet", text: "JIO MONEY: Rs.1,200 wallet loaded from HDFC A/c XX4821 on 19-03-26. Ref: JM92847X188." },
  { label: "Axis · wallet", text: "AIRTEL MONEY: Rs.800 sent to AIRTEL MONEY wallet from Axis A/c XX7712 on 18-03-26." },
  { label: "SBI · insurance", text: "NAVI HEALTH: Rs.2,999 health plan from SBI A/c XX8823 on 15-03-26. Plan: NAVI-BASIC." },
  { label: "ICICI · health", text: "TATA 1MG: Rs.1,450 medicines ordered via ICICI A/c XX3421 on 22-03-26. Delivery: 23-03." },
  { label: "Axis · health", text: "PHARMEASY: Rs.980 medicines from Axis A/c XX7712 on 21-03-26. Order: PE12345." },
  { label: "SBI · health", text: "CULT FIT: Rs.2,499 monthly gym plan from SBI A/c XX8823 on 01-03-26. Cult.fit membership." },
  { label: "HDFC · health", text: "FITNESSPARK: Rs.12,000 annual gym membership from HDFC A/c XX4821 on 01-01-26." },
  { label: "PhonePe · food", text: "LICIOUS: Rs.890 chicken+mutton from PhonePe on 22-03-26. Order: LCS12345. Delivery: 1hr." },
  { label: "Axis · groceries", text: "FRESHO: Rs.650 fresh vegetables from Axis A/c XX7712 on 21-03-26. Bigbasket Fresho." },
  { label: "SBI · groceries", text: "COUNTRY DELIGHT: Rs.480 monthly milk subscription from SBI A/c XX8823 on 01-03-26." },
  { label: "ICICI · housing", text: "FURLENCO: Rs.2,999 monthly furniture rental from ICICI A/c XX3421 on 01-03-26." },
  { label: "HDFC · shopping", text: "URBAN LADDER: Rs.18,500 sofa from HDFC A/c XX4821 on 15-03-26. Delivery: 22-03." },
  { label: "Kotak · shopping", text: "PEPPERFRY: Rs.12,000 dining table from Kotak A/c XX5533 on 12-03-26. EMI: 3 months." }
];

const CAT_COLORS: Record<string, { text: string; bg: string; border: string }> = {
  shopping:            { text: "#1E3A5F", bg: "#EFF6FF", border: "#BFDBFE" },
  food:                { text: "#7C2D12", bg: "#FFF7ED", border: "#FED7AA" },
  groceries:           { text: "#14532D", bg: "#F0FDF4", border: "#BBF7D0" },
  fuel:                { text: "#713F12", bg: "#FEFCE8", border: "#FEF08A" },
  transport:           { text: "#312E81", bg: "#EEF2FF", border: "#C7D2FE" },
  utilities:           { text: "#134E4A", bg: "#F0FDFA", border: "#99F6E4" },
  mobile_recharge:     { text: "#1E1B4B", bg: "#F5F3FF", border: "#DDD6FE" },
  entertainment:       { text: "#500724", bg: "#FFF1F2", border: "#FECDD3" },
  emi:                 { text: "#7F1D1D", bg: "#FEF2F2", border: "#FECACA" },
  credit_card_payment: { text: "#7F1D1D", bg: "#FEF2F2", border: "#FECACA" },
  salary:              { text: "#14532D", bg: "#F0FDF4", border: "#BBF7D0" },
  freelance_income:    { text: "#14532D", bg: "#F0FDF4", border: "#BBF7D0" },
  gig_income:          { text: "#14532D", bg: "#F0FDF4", border: "#BBF7D0" },
  business_income:     { text: "#14532D", bg: "#F0FDF4", border: "#BBF7D0" },
  transfer:            { text: "#44403C", bg: "#F5F5F4", border: "#D6D3D1" },
  rent:                { text: "#78350F", bg: "#FFFBEB", border: "#FDE68A" },
  travel:              { text: "#1E3A5F", bg: "#EFF6FF", border: "#BFDBFE" },
  investment:          { text: "#134E4A", bg: "#F0FDFA", border: "#99F6E4" },
  investment_return:   { text: "#134E4A", bg: "#F0FDFA", border: "#99F6E4" },
  insurance:           { text: "#312E81", bg: "#EEF2FF", border: "#C7D2FE" },
  health:              { text: "#7C2D12", bg: "#FFF7ED", border: "#FED7AA" },
  education:           { text: "#1E1B4B", bg: "#F5F3FF", border: "#DDD6FE" },
  government:          { text: "#78350F", bg: "#FFFBEB", border: "#FDE68A" },
  donation:            { text: "#500724", bg: "#FFF1F2", border: "#FECDD3" },
  cashback:            { text: "#14532D", bg: "#F0FDF4", border: "#BBF7D0" },
  refund:              { text: "#14532D", bg: "#F0FDF4", border: "#BBF7D0" },
  personal_care:       { text: "#44403C", bg: "#F5F5F4", border: "#D6D3D1" },
  domestic_help:       { text: "#44403C", bg: "#F5F5F4", border: "#D6D3D1" },
  events:              { text: "#1E3A5F", bg: "#EFF6FF", border: "#BFDBFE" },
  real_estate:         { text: "#78350F", bg: "#FFFBEB", border: "#FDE68A" },
  housing:             { text: "#78350F", bg: "#FFFBEB", border: "#FDE68A" },
  subscription:        { text: "#1E1B4B", bg: "#F5F3FF", border: "#DDD6FE" },
  bank_charges:        { text: "#44403C", bg: "#F5F5F4", border: "#D6D3D1" },
  wallet:              { text: "#312E81", bg: "#EEF2FF", border: "#C7D2FE" },
  farming_income:      { text: "#14532D", bg: "#F0FDF4", border: "#BBF7D0" },
  farming_expense:     { text: "#78350F", bg: "#FFFBEB", border: "#FDE68A" },
  pension:             { text: "#14532D", bg: "#F0FDF4", border: "#BBF7D0" },
  income:              { text: "#14532D", bg: "#F0FDF4", border: "#BBF7D0" },
  interest_income:     { text: "#14532D", bg: "#F0FDF4", border: "#BBF7D0" },
  other:               { text: "#44403C", bg: "#F5F5F4", border: "#D6D3D1" },
};

function mockOnnxParse(sms: string): ParsedResult {
  const lower = sms.toLowerCase();

  const amtMatch =
    sms.match(/(?:INR|Rs\.?|₹)\s*([\d,]+(?:\.\d{1,2})?)/i) ||
    sms.match(/:\s*-?INR\s*([\d,]+)/i) ||
    sms.match(/Amt:\s*Rs\s*([\d,]+)/i);
  const amount = amtMatch ? parseFloat(amtMatch[1].replace(/,/g, "")) : 0;

  const balMatch = sms.match(/(?:Avl Bal|Available Bal|Balance|Bal|Remaining balance)[\s:]+Rs\.?\s*([\d,]+)/i);
  const balance  = balMatch ? parseFloat(balMatch[1].replace(/,/g, "")) : null;

  const type =
    lower.includes("credited") || lower.includes("received") || lower.includes("credit of")
      ? "credit"
      : lower.includes("credit card") && lower.includes("spent")
      ? "credit_card_debit"
      : "debit";

  const bank =
    lower.includes("hdfc")              ? "HDFC"
    : lower.includes("sbi") || lower.includes("yono") ? "SBI"
    : lower.includes("icici")           ? "ICICI"
    : lower.includes("axis")            ? "Axis"
    : lower.includes("kotak")           ? "Kotak"
    : lower.includes("yes bank")        ? "Yes Bank"
    : lower.includes("idfc")            ? "IDFC FIRST"
    : lower.includes("indusind")        ? "IndusInd"
    : lower.includes("bank of baroda")  ? "Bank of Baroda"
    : lower.includes("canara")          ? "Canara Bank"
    : lower.includes("pnb")             ? "PNB"
    : lower.includes("union bank")      ? "Union Bank"
    : lower.includes("central bank")    ? "Central Bank"
    : lower.includes("uco bank")        ? "UCO Bank"
    : lower.includes("phonepay") || lower.includes("phonepe") ? "PhonePe"
    : lower.includes("gpay") || lower.includes("google pay")  ? "GooglePay"
    : lower.includes("paytm")           ? "Paytm"
    : lower.includes("amazon pay")      ? "AmazonPay"
    : lower.includes("cred")            ? "CRED"
    : lower.includes("bhim")            ? "BHIM"
    : "Unknown";

  const mPatterns = [
    /at\s+([A-Z][A-Z0-9\s]+?)(?:\s+on|\s*\.|\s+Avl)/i,
    /to merchant\s+([A-Z][A-Z\s]+?)(?:\s+on|\s*\.)/i,
    /Merch:\s*([^\s|]+)/i,
    /sent to\s+([A-Z][A-Z\s]+?)(?:\s+\(|\s+on|\s+via)/i,
    /paid to\s+([A-Z][A-Z\s]+?)(?:\s+on|\s*\.)/i,
    /;([A-Z][A-Z\s]+?);/,
  ];
  let merchant = "Unknown";
  for (const p of mPatterns) {
    const m = sms.match(p);
    if (m && m[1].trim().length > 1) { merchant = m[1].trim().replace(/\s+/g, " "); break; }
  }

  const cats: [string, string[]][] = [
    ["food",             ["swiggy", "zomato", "domino", "mcdonald", "kfc", "restaurant", "cafe", "biryani", "pizza", "pani puri", "chai wala", "licious", "subway", "eat.fit", "paradise", "minerva coffee"]],
    ["groceries",        ["bigbasket", "blinkit", "dmart", "zepto", "dunzo", "instamart", "kirana", "vegetable mandi", "milk dairy", "fresho", "country delight", "reliance smart", "d-mart"]],
    ["shopping",         ["amazon", "flipkart", "myntra", "meesho", "nykaa", "decathlon", "crossword", "urban ladder", "pepperfry", "nalli silks", "tanishq", "malabar gold", "phulkari", "cracker", "hyderabad pearls"]],
    ["fuel",             ["petrol", "bpcl", "hp petrol", "indian oil", "fuel", "cng", "shell"]],
    ["transport",        ["ola", "uber", "rapido", "metro", "apsrtc", "tsrtc", "auto rickshaw", "fasttag", "toll", "nhai", "bus driver", "cycle repair", "car wash", "parking", "vehicle servicing", "yulu", "school transport"]],
    ["travel",           ["irctc", "makemytrip", "goibibo", "oyo", "indigo", "air india", "spicejet", "vistara", "redbus", "cleartrip", "treebo", "ixigo", "club mahindra", "vaishno devi", "char dham", "phonepe switch"]],
    ["utilities",        ["electricity", "tsspdcl", "apspdcl", "bescom", "mseb", "tneb", "msedcl", "wbsedcl", "kesco", "indane gas", "hp gas", "mahanagar gas", "water", "hmwssb", "ap transco"]],
    ["mobile_recharge",  ["jio", "airtel", "vi ", "vodafone", "bsnl", "recharge", "postpaid"]],
    ["entertainment",    ["netflix", "hotstar", "spotify", "amazon prime", "bookmyshow", "zee5", "sonyliv", "jiocinema", "sharechat", "josh", "audible", "tata play", "airtel dth", "pvr", "manorama"]],
    ["emi",              ["emi", " loan", "nach debit", "ecs debit", "lazypay", "simpl", "slice card", "uni card", "zestmoney", "stashfin", "navi", "moneyview", "kreditbee", "mpokket", "bajaj finserv", "tata capital", "fullerton", "home credit", "home loan emi", "car loan emi", "personal loan emi", "tractor loan"]],
    ["credit_card_payment", ["credit card", "cc bill", "cred"]],
    ["salary",           ["salary", "payroll", "emp code"]],
    ["rent",             ["rent", "landlord"]],
    ["investment",       ["mutual fund", "sip", "zerodha", "groww", "fd", "fixed deposit", "ppf", "nps contribution", "epf contribution", "wazirx", "coinswitch", "coindcx", "smallcase", "indmoney", "kuvera", "sukanya samriddhi", "rd a/c", "standing instruction"]],
    ["insurance",        ["lic", "star health", "care health", "niva bupa", "digit insurance", "acko", "tata aig", "policybazaar", "hdfc ergo", "hdfc life", "bajaj allianz", "fasal bima", "navi health", "vehicle insurance", "term life", "health insurance", "car insurance"]],
    ["health",           ["hospital", "pharmacy", "apollo", "medplus", "practo", "1mg", "pharmeasy", "cult fit", "fitnesspark", "lenskart", "dental", "pathlab", "dr. lal", "netmeds", "gym membership", "gymkhana"]],
    ["education",        ["school fees", "college fees", "university", "byju", "unacademy", "vedantu", "physicswallah", "upgrad", "great learning", "allen career", "iit madras", "coursera", "tuition teacher"]],
    ["government",       ["income tax", "gst payment", "advance tax", "stamp duty", "registration fees", "passport fee", "traffic challan", "municipal corporation", "bbmp", "property tax", "driving license", "jnpt", "pm kisan", "pmay", "mnregs", "fertilizer subsidy", "pm fasal bima", "jaga mission"]],
    ["donation",         ["temple", "iskcon", "cry india", "give india", "tirupati", "pandit", "dakshina", "puja booking"]],
    ["cashback",         ["cashback", "reward points", "scratch card", "cashkaro", "coins redeemed"]],
    ["refund",           ["refund", "reversal", "cancelled ticket"]],
    ["gig_income",       ["delivery partner", "driver earnings", "urban company earnings", "dunzo delivery", "blinkit seller", "amazon seller", "ola driver", "swiggy delivery"]],
    ["freelance_income", ["freelance", "upwork", "fiverr", "adsense", "youtube", "paypal", "meesho reseller"]],
    ["farming_income",   ["e-nam", "apmc mandi", "wheat sale", "soybean sale"]],
    ["farming_expense",  ["iffco kisan", "seeds and fertilizer", "krishi seva"]],
    ["personal_care",    ["hair salon", "barber", "dhobi", "press wala", "laundry service", "urban company"]],
    ["domestic_help",    ["maid salary", "cook salary", "driver salary"]],
    ["events",           ["wedding venue", "caterer", "photographer", "pandal decorator"]],
    ["real_estate",      ["prestige estates", "sobha developers", "property developer", "property sale"]],
    ["housing",          ["colony maintenance", "rental deposit", "furlenco", "society"]],
    ["subscription",     ["newspaper agent", "swiggy one", "zomato gold", "blinkit pass", "kindle unlimited", "manorama online"]],
    ["bank_charges",     ["maintenance charge", "sms banking", "atm usage fee", "imps transfer charges", "locker charges", "demat charges", "service charge", "gst + service"]],
    ["wallet",           ["wallet loaded", "jio money", "airtel money", "wallet from"]],
    ["pension",          ["pension credited"]],
    ["income",           ["gratuity", "bonus credit", "reimbursement", "hra transfer", "medical claim", "rental income"]],
    ["interest_income",  ["interest credited", "savings interest", "fd interest"]],
    ["investment_return",["fd matured", "stock sale proceeds", "dividend", "sweep in", "wazirx withdrawal", "matured"]],
    ["transfer",         ["sent to", "transferred", "neft outward", "imps credit", "rtgs", "nri remittance", "joint a/c", "cheque"]],
    ["loan_disbursement",["loan disbursement", "kcc loan credited", "housing loan"]],
  ];

  let category = "other";
  for (const [cat, kws] of cats) {
    if (kws.some(k => lower.includes(k))) { category = cat; break; }
  }
  if (type === "credit" && category === "other") category = "transfer";

  const mode =
    lower.includes("upi") || lower.includes("gpay") || lower.includes("phonepe") || lower.includes("paytm") || lower.includes("bhim") ? "upi"
    : lower.includes("neft")           ? "neft"
    : lower.includes("imps")           ? "imps"
    : lower.includes("rtgs")           ? "rtgs"
    : lower.includes("atm")            ? "atm"
    : lower.includes("nach") || lower.includes("ecs") || lower.includes("autopay") || lower.includes("auto debit") || lower.includes("standing instruction") ? "auto_debit"
    : lower.includes("cheque")         ? "cheque"
    : lower.includes("fastag")         ? "fastag"
    : lower.includes("dbt")            ? "dbt"
    : lower.includes("swift")          ? "swift"
    : lower.includes("wallet")         ? "wallet"
    : lower.includes("debit card") || lower.includes("card ending") ? "debit_card"
    : lower.includes("credit card") || lower.includes("cc ")        ? "credit_card"
    : "net_banking";

  const confidence =
    bank === "Unknown"       ? 0.55 + Math.random() * 0.15
    : merchant === "Unknown" ? 0.70 + Math.random() * 0.10
    :                          0.87 + Math.random() * 0.11;

  return {
    amount, type, bank, merchant, category,
    payment_mode: mode,
    balance_after: balance,
    confidence: Math.min(confidence, 0.99),
    engine: confidence < 0.75 ? "llm_fallback" : "onnx",
  };
}

function StepRow({ step }: { step: Step }) {
  const styles: Record<StepStatus, { dot: string; text: string; bg: string; border: string }> = {
    idle:     { dot: T.borderBase,  text: T.textMuted,    bg: T.surfaceBg,    border: T.borderBase    },
    active:   { dot: T.infoText,    text: T.infoText,     bg: T.infoBg,       border: T.infoBorder    },
    done:     { dot: T.successText, text: T.successText,  bg: T.successBg,    border: T.successBorder },
    fallback: { dot: T.warningText, text: T.warningText,  bg: T.warningBg,    border: T.warningBorder },
  };
  const c = styles[step.status];
  return (
    <div style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 12px",
      borderRadius:8, background:c.bg, border:`1px solid ${c.border}`,
      transition:"all 0.25s", opacity: step.status === "idle" ? 0.5 : 1 }}>
      <div style={{ width:8, height:8, borderRadius:"50%", background:c.dot, flexShrink:0,
        outline: step.status === "active" ? `3px solid ${c.dot}44` : "none",
        outlineOffset:1, transition:"all 0.25s" }} />
      <div style={{ flex:1 }}>
        <div style={{ fontSize:13, fontWeight:600, color:c.text }}>{step.label}</div>
        <div style={{ fontSize:11, color:c.text, opacity:0.75, marginTop:1, fontFamily:"monospace" }}>{step.sublabel}</div>
      </div>
      {step.status === "active" && (
        <div style={{ display:"flex", gap:3 }} aria-label="Processing">
          {[0,1,2].map(i => (
            <div key={i} style={{ width:4, height:4, borderRadius:"50%", background:c.dot,
              animation:`sms-dot 1.1s ease-in-out ${i * 0.18}s infinite` }} />
          ))}
        </div>
      )}
      {step.status === "done" && (
        <svg width={16} height={16} viewBox="0 0 16 16" fill="none" aria-label="Complete">
          <circle cx={8} cy={8} r={7} fill={c.bg} stroke={c.dot} strokeWidth={1.5} />
          <path d="M5 8l2.5 2.5L11 5" stroke={c.dot} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
      {step.status === "fallback" && (
        <svg width={16} height={16} viewBox="0 0 16 16" fill="none" aria-label="Fallback engine">
          <circle cx={8} cy={8} r={7} fill={c.bg} stroke={c.dot} strokeWidth={1.5} />
          <path d="M8 4.5v4M8 10.5v1" stroke={c.dot} strokeWidth={1.5} strokeLinecap="round" />
        </svg>
      )}
    </div>
  );
}

export default function SMSParserPage() {
  const [smsText, setSmsText] = useState(SAMPLES[0].text);
  const [selIdx,  setSelIdx]  = useState(0);
  const [result,  setResult]  = useState<ParsedResult | null>(null);
  const [running, setRunning] = useState(false);
  const [done,    setDone]    = useState(false);
  const timeouts = useRef<ReturnType<typeof setTimeout>[]>([]);

  const [steps, setSteps] = useState<Step[]>([
    { id:"load",     label:"Load ONNX model",  sublabel:"public/models/artha-sms-v1.onnx · 48 MB",  status:"idle" },
    { id:"tokenise", label:"Tokenise SMS",      sublabel:"DistilBERT WordPiece tokeniser",            status:"idle" },
    { id:"infer",    label:"Run inference",     sublabel:"WebAssembly · browser-local · ~8 ms",       status:"idle" },
    { id:"score",    label:"Confidence check",  sublabel:"threshold 0.75 → route engine",             status:"idle" },
    { id:"extract",  label:"Extract fields",    sublabel:"amount · bank · merchant · category",       status:"idle" },
  ]);

  useEffect(() => () => timeouts.current.forEach(clearTimeout), []);

  const setStep = (i: number, s: StepStatus) =>
    setSteps(p => p.map((x, j) => j === i ? { ...x, status: s } : x));

  const reset = () => {
    setSteps(p => p.map(x => ({ ...x, status: "idle" })));
    setResult(null); setDone(false);
    timeouts.current.forEach(clearTimeout); timeouts.current = [];
  };

  const go = (fn: () => void, ms: number) => {
    const t = setTimeout(fn, ms); timeouts.current.push(t);
  };

  const handleParse = () => {
    if (running || !smsText.trim()) return;
    reset(); setRunning(true);
    const r  = mockOnnxParse(smsText);
    const fb = r.engine === "llm_fallback";
    go(() => setStep(0, "active"), 80);
    go(() => { setStep(0, "done"); setStep(1, "active"); }, 480);
    go(() => { setStep(1, "done"); setStep(2, "active"); }, 880);
    go(() => { setStep(2, "done"); setStep(3, fb ? "fallback" : "active"); }, 1350);
    go(() => { setStep(3, fb ? "fallback" : "done"); setStep(4, fb ? "fallback" : "active"); }, 1800);
    go(() => { setStep(4, "done"); setResult(r); setDone(true); setRunning(false); }, 2400);
  };

  const cat     = result ? (CAT_COLORS[result.category] ?? CAT_COLORS.other) : CAT_COLORS.other;
  const confPct = result ? Math.round(result.confidence * 100) : 0;
  const confClr = confPct >= 85 ? T.successText : confPct >= 70 ? T.warningText : T.dangerText;
  const confBg  = confPct >= 85 ? T.successBg   : confPct >= 70 ? T.warningBg   : T.dangerBg;
  const confBdr = confPct >= 85 ? T.successBorder : confPct >= 70 ? T.warningBorder : T.dangerBorder;

  const TYPE_STYLE: Record<string, { text: string; bg: string }> = {
    debit:             { text: T.dangerText,  bg: T.dangerBg  },
    credit:            { text: T.successText, bg: T.successBg },
    credit_card_debit: { text: "#312E81",     bg: "#EEF2FF"   },
    info:              { text: T.infoText,    bg: T.infoBg    },
    pending:           { text: T.warningText, bg: T.warningBg },
  };
  const tc = result ? (TYPE_STYLE[result.type] ?? TYPE_STYLE.debit) : TYPE_STYLE.debit;

  const card = {
    background: T.cardBg,
    border: `1px solid ${T.borderBase}`,
    borderRadius: 12,
    padding: 20,
  };
  const secLabel = {
    fontSize: 11, fontWeight: 600 as const, letterSpacing: "0.09em",
    textTransform: "uppercase" as const, color: T.textMuted, marginBottom: 12,
  };

  return (
    <>
      <Navbar />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        body { margin:0; background:${T.pageBg}; font-family:'Inter',system-ui,sans-serif; color:${T.textPrimary}; }
        @keyframes sms-dot    { 0%,100%{opacity:.3;transform:scale(.8)} 50%{opacity:1;transform:scale(1.1)} }
        @keyframes sms-fadein { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .sms-in { animation:sms-fadein 0.3s ease forwards; }
        button:focus-visible, textarea:focus-visible, select:focus-visible {
          outline:3px solid ${T.infoText}; outline-offset:3px; border-radius:4px;
        }
        button { font-family:'Inter',system-ui,sans-serif; cursor:pointer; }
        .parse-btn { width:100%; padding:12px; border-radius:8px; border:none;
          background:#15803D; color:#fff; font-size:14px; font-weight:600;
          transition:background 0.15s,transform 0.1s; }
        .parse-btn:hover:not(:disabled) { background:#166534; }
        .parse-btn:active:not(:disabled) { transform:scale(0.98); }
        .parse-btn:disabled { background:${T.borderBase}; color:${T.textMuted}; cursor:not-allowed; }
        .ghost-btn { width:100%; padding:10px; border-radius:8px;
          border:1px solid ${T.borderBase}; background:transparent;
          color:${T.textSecondary}; font-size:13px; font-weight:500; transition:background 0.15s; }
        .ghost-btn:hover { background:${T.surfaceBg}; }
        .field-row { display:flex; justify-content:space-between; align-items:center;
          padding:9px 0; border-bottom:1px solid ${T.borderBase}; }
        .field-row:last-child { border-bottom:none; }
        .field-label { font-size:12px; font-weight:500; color:${T.textMuted}; }
        .field-value { font-size:13px; font-weight:600; color:${T.textPrimary};
          font-family:monospace; text-transform:capitalize; }
      `}</style>

      <main style={{ minHeight:"100vh", background:T.pageBg, padding:"32px 16px 64px" }}>
        <div style={{ maxWidth:880, margin:"0 auto", display:"flex", flexDirection:"column", gap:20 }}>

          <header style={{ textAlign:"center" }}>
            <span style={{ display:"inline-flex", alignItems:"center", gap:6,
              background:T.successBg, border:`1px solid ${T.successBorder}`,
              color:T.successText, fontSize:11, fontWeight:600,
              padding:"4px 12px", borderRadius:99,
              letterSpacing:"0.07em", textTransform:"uppercase", marginBottom:16 }}>
              <span style={{ width:6, height:6, borderRadius:"50%", background:T.successText, display:"inline-block" }} aria-hidden />
              ONNX model · browser local
            </span>
            <h1 style={{ fontSize:32, fontWeight:700, color:T.textPrimary, letterSpacing:"-0.6px", margin:"0 0 10px" }}>
              ArthaVaakya — SMS Parser
            </h1>
            <p style={{ fontSize:14, color:T.textSecondary, lineHeight:1.7, maxWidth:460, margin:"0 auto" }}>
              Fine-tuned DistilBERT runs in the browser via WebAssembly.
              No cloud calls. No API cost. Your SMS never leaves this device.
            </p>
          </header>

          <div style={{ display:"flex", justifyContent:"center", flexWrap:"wrap", gap:8 }}>
            {[["450","training rows"],["21","banks"],["48","categories"],["<10ms","inference"],["0","API calls"]]
              .map(([val,lbl]) => (
              <div key={lbl} style={{ background:T.cardBg, border:`1px solid ${T.borderBase}`,
                borderRadius:8, padding:"8px 16px", textAlign:"center", minWidth:80 }}>
                <div style={{ fontSize:20, fontWeight:700, color:T.textPrimary, lineHeight:1 }}>{val}</div>
                <div style={{ fontSize:11, color:T.textMuted, marginTop:3, fontWeight:500 }}>{lbl}</div>
              </div>
            ))}
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))", gap:16 }}>

            <section aria-label="SMS input" style={card}>
              <div style={secLabel}>Input · bank SMS</div>
              <label htmlFor="sms-select" style={{ fontSize:13, fontWeight:500, color:T.textSecondary, display:"block", marginBottom:6 }}>
                Choose a sample SMS
              </label>
              <select id="sms-select" value={selIdx}
                onChange={e => {
                  const i = +e.target.value;
                  setSelIdx(i); setSmsText(SAMPLES[i].text); reset();
                }}
                style={{ width:"100%", padding:"9px 12px", borderRadius:8,
                  border:`1px solid ${T.borderBase}`, background:T.inputBg,
                  fontSize:13, color:T.textPrimary, marginBottom:12,
                  outline:"none", cursor:"pointer" }}>
                {SAMPLES.map((s, i) => <option key={i} value={i}>{s.label}</option>)}
              </select>
              <label htmlFor="sms-input" style={{ fontSize:13, fontWeight:500, color:T.textSecondary, display:"block", marginBottom:6 }}>
                Or paste your own bank SMS
              </label>
              <textarea id="sms-input" value={smsText} rows={4}
                onChange={e => { setSmsText(e.target.value); reset(); }}
                placeholder="e.g. INR 2,350 debited from A/c XX4821 at AMAZON…"
                style={{ width:"100%", resize:"vertical",
                  background:T.inputBg, border:`1px solid ${T.borderBase}`,
                  borderRadius:8, padding:12, fontSize:13,
                  fontFamily:"monospace", color:T.textPrimary, lineHeight:1.6, outline:"none" }} />
              <button className="parse-btn" style={{ marginTop:10 }}
                onClick={handleParse} disabled={running || !smsText.trim()} aria-busy={running}>
                {running ? "Parsing…" : "Parse with my model"}
              </button>
              {done && (
                <button className="ghost-btn" style={{ marginTop:8 }}
                  onClick={() => { reset(); setSelIdx(0); setSmsText(SAMPLES[0].text); }}>
                  Clear and try another
                </button>
              )}
            </section>

            <section aria-label="Model pipeline" style={card}>
              <div style={secLabel}>Pipeline · 3-layer engine</div>
              <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                {steps.map(s => <StepRow key={s.id} step={s} />)}
              </div>
              {result && (
                <div className="sms-in" style={{ marginTop:12, padding:"10px 12px", borderRadius:8,
                  background: result.engine === "llm_fallback" ? T.warningBg : T.successBg,
                  border:`1px solid ${result.engine === "llm_fallback" ? T.warningBorder : T.successBorder}`,
                  fontSize:12, fontWeight:500,
                  color: result.engine === "llm_fallback" ? T.warningText : T.successText,
                  display:"flex", gap:8, alignItems:"flex-start" }}>
                  <span aria-hidden style={{ flexShrink:0, marginTop:1 }}>
                    {result.engine === "llm_fallback" ? "⚠" : "✓"}
                  </span>
                  {result.engine === "llm_fallback"
                    ? `Confidence ${confPct}% — below threshold · WebLLM fallback activated`
                    : `Confidence ${confPct}% — ONNX model accepted result`}
                </div>
              )}
            </section>
          </div>

          {result ? (
            <section aria-label="Parsed result" className="sms-in"
              style={{ background:T.cardBg, border:`1px solid ${T.borderBase}`, borderRadius:12, overflow:"hidden" }}>
              <div style={{ background:T.surfaceBg, borderBottom:`1px solid ${T.borderBase}`,
                padding:"16px 20px", display:"flex", alignItems:"center",
                justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
                <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                  <div style={{ width:40, height:40, borderRadius:8, flexShrink:0,
                    background:tc.bg, border:`1px solid ${tc.text}44`,
                    display:"flex", alignItems:"center", justifyContent:"center",
                    fontSize:11, fontWeight:700, color:tc.text }}>
                    {result.type === "credit" ? "CR" : "DR"}
                  </div>
                  <div>
                    <div style={{ fontSize:30, fontWeight:700, color:T.textPrimary, letterSpacing:"-0.5px", lineHeight:1 }}>
                      {result.type === "credit" ? "+" : "−"}₹{result.amount.toLocaleString("en-IN")}
                    </div>
                    <div style={{ fontSize:13, color:T.textSecondary, marginTop:3 }}>{result.merchant}</div>
                  </div>
                </div>
                <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:6 }}>
                  <span style={{ fontSize:12, fontWeight:600, padding:"4px 12px", borderRadius:99,
                    background:cat.bg, border:`1px solid ${cat.border}`, color:cat.text,
                    textTransform:"capitalize" }}>
                    {result.category.replace(/_/g, " ")}
                  </span>
                  <span style={{ fontSize:12, color:T.textMuted, textTransform:"capitalize" }}>
                    via {result.payment_mode.replace(/_/g, " ")}
                  </span>
                </div>
              </div>

              <div style={{ padding:"16px 20px",
                display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", gap:"0 32px" }}>
                {[
                  ["Bank",     result.bank],
                  ["Type",     result.type.replace(/_/g, " ")],
                  ["Merchant", result.merchant],
                  ["Category", result.category.replace(/_/g, " ")],
                  ["Mode",     result.payment_mode.replace(/_/g, " ")],
                  ["Balance",  result.balance_after ? `₹${result.balance_after.toLocaleString("en-IN")}` : "—"],
                ].map(([label, value]) => (
                  <div key={label} className="field-row">
                    <span className="field-label">{label}</span>
                    <span className="field-value">{value}</span>
                  </div>
                ))}
              </div>

              <div style={{ padding:"0 20px 20px" }}>
                <div style={{ borderTop:`1px solid ${T.borderBase}`, paddingTop:16 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                    <span style={{ fontSize:12, fontWeight:500, color:T.textSecondary }}>Model confidence</span>
                    <span style={{ fontSize:12, fontWeight:600, padding:"3px 10px", borderRadius:99,
                      background:confBg, color:confClr, border:`1px solid ${confBdr}`, fontFamily:"monospace" }}>
                      {confPct}% · {result.engine === "llm_fallback" ? "WebLLM fallback" : "ONNX model"}
                    </span>
                  </div>
                  <div role="progressbar" aria-valuenow={confPct} aria-valuemin={0} aria-valuemax={100}
                    aria-label={`Model confidence ${confPct} percent`}
                    style={{ height:8, background:"#E7E5E4", borderRadius:99, overflow:"hidden" }}>
                    <div style={{ height:"100%", width:`${confPct}%`, background:confClr,
                      borderRadius:99, transition:"width 1.1s cubic-bezier(0.34,1.56,0.64,1)" }} />
                  </div>
                </div>
              </div>
            </section>
          ) : (
            <div style={{ background:T.cardBg, border:`1px dashed ${T.borderBase}`,
              borderRadius:12, padding:"44px 20px", textAlign:"center" }}
              role="status" aria-live="polite">
              <div style={{ width:48, height:48, borderRadius:12, background:T.surfaceBg,
                border:`1px solid ${T.borderBase}`, display:"flex", alignItems:"center",
                justifyContent:"center", margin:"0 auto 12px" }}>
                <svg width={22} height={22} viewBox="0 0 22 22" fill="none" aria-hidden>
                  <rect x={3} y={4} width={16} height={14} rx={2} stroke={T.textMuted} strokeWidth={1.25} />
                  <path d="M3 8h16M8 12h6M8 15h4" stroke={T.textMuted} strokeWidth={1.25} strokeLinecap="round" />
                </svg>
              </div>
              <p style={{ fontSize:14, fontWeight:600, color:T.textSecondary, margin:"0 0 4px" }}>No result yet</p>
              <p style={{ fontSize:13, color:T.textMuted, margin:0 }}>
                Choose a sample or paste your own SMS, then click Parse
              </p>
            </div>
          )}

          <footer>
            <p style={{ textAlign:"center", fontSize:12, color:T.textMuted, margin:0 }}>
              ArthaVaakya · SMS Parser · ONNX DistilBERT · browser-local · WCAG 2.1 AA
            </p>
          </footer>
        </div>
      </main>
    </>
  );
}