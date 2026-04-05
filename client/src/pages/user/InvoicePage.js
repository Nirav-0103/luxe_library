import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getOrderByIdAPI } from '../../api';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import './InvoicePage.css'; // Let's also create this css file for luxury styling

export default function InvoicePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return; // wait for context if refreshing
    fetchOrder();
  }, [id, user]);

  const fetchOrder = async () => {
    try {
      const res = await getOrderByIdAPI(id);
      setOrder(res.data.data);
    } catch (err) {
      toast.error('Could not load invoice. Not authorized or not found.');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) return <div style={{display:'flex',justifyContent:'center',padding:40}}><span className="spinner"></span></div>;
  if (!order) return <div style={{textAlign:'center',padding:40,color:'white'}}><h2>Invoice not found</h2><button onClick={()=>navigate(-1)} style={{marginTop:20,padding:'10px 20px',background:'var(--gold)',color:'black',border:'none',borderRadius:4,cursor:'pointer'}}>Go Back</button></div>;

  return (
    <div className="invoice-layout">
      {/* Non-printable controls */}
      <div className="invoice-controls no-print">
        <button className="invoice-btn outline" onClick={() => {
          if (window.history.length > 2) navigate(-1);
          else { window.close(); setTimeout(() => navigate(user?.role==='admin' ? '/admin/orders' : '/dashboard'), 100); }
        }}>← Close Window</button>
        <button className="invoice-btn default" onClick={handlePrint}>🖨️ Print / Download PDF</button>
      </div>

      {/* Printable Invoice Document */}
      <div className="invoice-doc">
        <div className="invoice-header">
          <div className="invoice-brand">
            <span className="invoice-brand-icon">✦</span>
            <h2>LUXE LIBRARY</h2>
          </div>
          <div className="invoice-title">
            <h1>TAX INVOICE</h1>
            <p className="invoice-number">#{order.orderNumber}</p>
          </div>
        </div>

        <div className="invoice-strip"></div>

        <div className="invoice-details">
          <div className="invoice-section">
            <h4 className="invoice-label">Billed To (Customer):</h4>
            <div className="invoice-info">
              <strong>{order.user.name}</strong>
              <p>{order.user.email}</p>
              {order.user.phone && <p>{order.user.phone}</p>}
              {order.deliveryAddress && (
                <p className="invoice-address">
                  {order.deliveryAddress.street},<br/>
                  {/* Fix #19: Use pincode (not zipCode) */}
                  {order.deliveryAddress.city}, {order.deliveryAddress.state} {order.deliveryAddress.pincode}
                </p>
              )}
            </div>
          </div>
          <div className="invoice-section right">
            <h4 className="invoice-label">Issued By:</h4>
            <div className="invoice-info">
              <strong>Luxe Library India</strong>
              <p>123 Heritage Row, Downtown Area</p>
              <p>Ahmedabad, Gujarat 380001</p>
              <p>GSTIN: 24AAABC1234D1Z5</p>
              <p>Email: support@luxelibrary.in</p>
            </div>
            
            <div className="invoice-meta-grid">
              <div className="invoice-meta-box">
                <span className="meta-label">Date Issued</span>
                <span className="meta-value">{new Date(order.createdAt).toLocaleDateString('en-IN', {year: 'numeric', month: 'long', day: 'numeric'})}</span>
              </div>
              <div className="invoice-meta-box">
                <span className="meta-label">Payment Method</span>
                <span className="meta-value">{order.paymentMethod.toUpperCase()} ({order.paymentStatus})</span>
              </div>
            </div>
          </div>
        </div>

        <table className="invoice-table">
          <thead>
            <tr>
              <th width="5%">#</th>
              <th width="45%">Item Description</th>
              <th width="15%" style={{textAlign:'center'}}>Qty</th>
              <th width="15%" style={{textAlign:'right'}}>Rate</th>
              <th width="20%" style={{textAlign:'right'}}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item, idx) => (
              <tr key={idx}>
                <td>{idx + 1}</td>
                <td>
                  {/* Fix #18: Fallback to stored title/author if book was deleted */}
                  <strong style={{display:'block'}}>{item.book?.title || item.title}</strong>
                  <span style={{fontSize:'12px', color:'#666'}}>By {item.book?.author || item.author} {item.book?.isbn ? `| ISBN: ${item.book.isbn}` : ''}</span>
                </td>
                <td style={{textAlign:'center'}}>{item.quantity || 1}</td>
                <td style={{textAlign:'right'}}>₹{item.price}</td>
                <td style={{textAlign:'right'}}>₹{(item.price * (item.quantity || 1)).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="invoice-totals">
          <div className="invoice-totals-left">
            <p className="invoice-amount-words">
              <strong>Amount in Words:</strong><br/>
              {/* Fix #20: Round to integer before converting to words */}
              Rupees {convertNumberToWords(Math.round(order.totalAmount))} Only
            </p>
          </div>
          <div className="invoice-totals-right">
            <div className="totals-row">
              <span>Subtotal</span>
              <span>₹{order.totalAmount.toFixed(2)}</span>
            </div>
            <div className="totals-row">
              <span>Tax / VAT (Included)</span>
              <span>₹0.00</span>
            </div>
            <div className="totals-row grand">
              <span>Grand Total</span>
              <span>₹{order.totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="invoice-footer">
          <p>This is a computer generated invoice and does not require a physical signature.</p>
          <p>Thank you for shopping with Luxe Library. We hope you enjoy your reading journey.</p>
        </div>
      </div>
    </div>
  );
}

// Fix #20: Handle numbers up to Lakhs/Crores properly
function convertNumberToWords(amount) {
  const n = Math.round(amount); // ensure integer
  if (n === 0) return 'Zero';
  const words = ['', 'One','Two','Three','Four','Five','Six','Seven','Eight','Nine',
    'Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
  const tens  = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];

  function helper(num) {
    if (num === 0) return '';
    if (num < 20)  return words[num] + ' ';
    if (num < 100) return tens[Math.floor(num / 10)] + ' ' + helper(num % 10);
    if (num < 1000) return words[Math.floor(num / 100)] + ' Hundred ' + helper(num % 100);
    if (num < 100000) return helper(Math.floor(num / 1000)) + 'Thousand ' + helper(num % 1000);
    if (num < 10000000) return helper(Math.floor(num / 100000)) + 'Lakh ' + helper(num % 100000);
    return helper(Math.floor(num / 10000000)) + 'Crore ' + helper(num % 10000000);
  }
  return helper(n).trim();
}
