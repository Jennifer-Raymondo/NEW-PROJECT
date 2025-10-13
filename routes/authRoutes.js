//working routes
const express = require('express');
const router = express.Router();
const passport = require('passport');
//const Employee = require('../models/employeeModel')



// Models
const Employee = require('../models/employeeModel');
const salesmodel = require('../models/salesModels');
const stockModels = require('../models/stockModels');


// Middleware
const { ensureAuthenticated, ensureManager, ensureAttendant } = require('../middleware/auth');

// ----------------------
// LANDING + AUTH
// ----------------------
router.get('/', (req, res) => {
  res.render('index', { title: 'Landing Page' });
});

// Signup form
router.get('/signup', (req, res) => res.render('signup'));
router.post('/signup', async (req, res) => {
  try {
    const { fullname, email, phone, department, username, password, role } = req.body;
    const employee = new Employee({ fullname, email, phone, department, username, role });
    await Employee.register(employee, password);
    res.redirect('/login');
  } catch (err) {
    console.error("Signup error:", err);
    res.status(400).send("Error signing up user. Check all required fields and uniqueness.");
  }
});



// Login form
router.get('/login', (req, res) => res.render('login'));

router.post(
  '/login',
  passport.authenticate('local', { failureRedirect: '/login' }),
  (req, res) => {
    if (!req.user) return res.redirect('/login'); // sanity check


     // ✅ Redirect attendants straight to saleslist
    if (req.user.role === 'attendant') return res.redirect('/saleslist');


    // ✅ Both roles redirect to /dashboard
    return res.redirect('/dashboard');
  }
);





//dashborad
// Example route (dashboard.js)
router.get('/dashboard', ensureAuthenticated, ensureManager, async (req, res) => {
  try {
    const sales = await salesmodel.find();
    const finishedItems = await stockModels.find();

    // compute totals
    const totalSales = sales.reduce((sum, s) => sum + (s.totalAmount || 0), 0);
    const totalStockExpense = finishedItems.reduce((sum, s) => sum + (s.quantity * (s.costPrice || 0)), 0);
    const totalProducts = finishedItems.reduce((sum, s) => sum + s.quantity, 0);

    // ✅ count sales records properly
    const totalSalesRecords = sales.length;

    res.render('dashboard', {
      totalSales,
      totalStockExpense,
      finishedProducts: { totalQuantity: totalProducts },
      salesRecords: { totalCount: totalSalesRecords }   // ✅ pass this
    });
  } catch (err) {
    console.error("Dashboard error:", err);
    res.status(500).send("Failed to load dashboard");
  }
});




// Logout
router.get('/logout', (req, res, next) => {
  req.logout(function (err) {
    if (err) return next(err);
    // Render the logout confirmation page
    res.render('logout', { title: 'Logout' });
  });
});





// ----------------------
// SALES LIST (all transactions, attendants + managers)
// ----------------------
router.get('/saleslist', ensureAuthenticated, async (req, res) => {
  try {
    // Fetch all sales as they are (every transaction)
    const items = await salesmodel.find().sort({ $natural: -1 });

    // Totals
    let totalSales = 0;
    let totalQuantitySold = 0;
    items.forEach(sale => {
      totalSales += sale.quantity * sale.sellingPrice;
      totalQuantitySold += sale.quantity;
    });

    res.render('salesList', {   // 🔹 use a different template
      items,
      totalSales,
      totalQuantitySold,
      role: req.user.role
    });
  } catch (err) {
    console.error("Error loading Sales List:", err);
    res.status(500).send("Unable to load sales list");
  }
});




// ----------------------
// SALES RECORDS (summary view, managers only)
// ----------------------
router.get('/salesRecords', ensureAuthenticated, ensureManager, async (req, res) => {
  try {
    // Fetch all sales, latest first
    const sales = await salesmodel.find().sort({ date: -1 });

    // Group by product
    const groupedSales = {};
    sales.forEach(sale => {
      if (!groupedSales[sale.productName]) {
        groupedSales[sale.productName] = {
          productName: sale.productName,
          quantity: 0
        };
      }
      groupedSales[sale.productName].quantity += sale.quantity;
    });

    const chartData = Object.values(groupedSales);

    // Totals
    const totalSales = sales.reduce((sum, s) => sum + (s.quantity * s.sellingPrice), 0);
    const totalQuantitySold = sales.reduce((sum, s) => sum + s.quantity, 0);

    res.render('salesRecords', {
      items: sales,          // full list for table
      chartData,             // ✅ grouped data for pie chart
      totalSales,
      totalQuantitySold,
      role: req.user.role
    });

  } catch (err) {
    console.error("Error loading Sales Records:", err);
    res.status(500).send("Error loading Sales Records page");
  }
});




// GET: Show sales entry form
// ✅ SALES FORM (aggregated stock quantities)
router.get('/sales', ensureAuthenticated, async (req, res) => {
  try {
    // Aggregate stock quantities by product name and type
    const stocks = await stockModels.aggregate([
      {
        $group: {
          _id: { productName: "$productName", productType: "$productType" },
          totalQuantity: { $sum: "$quantity" }
        }
      },
      {
        $project: {
          _id: 0,
          productName: "$_id.productName",
          productType: "$_id.productType",
          quantity: "$totalQuantity"
        }
      },
      { $sort: { productType: 1, productName: 1 } }
    ]);

    res.render('sales', { 
      role: req.user.role, 
      stocks 
    });
  } catch (err) {
    console.error("Error loading sales page:", err);
    res.status(500).send("Unable to load sales page");
  }
});






// Record a sale: allow both roles
router.post('/sales', ensureAuthenticated, async (req, res) => {
  try {
    const { productName, quantity } = req.body;

    // 1️⃣ Find stock item by productName (you could also use productId if you store that)
    const stockItem = await stockModels.findOne({ 
  productName: { $regex: `^${productName}$`, $options: 'i' } 
});

    if (!stockItem) {
      return res.status(404).send("Stock item not found!");
    }

    // 2️⃣ Check if enough stock is available
    if (stockItem.quantity < quantity) {
      return res.status(400).send("Not enough stock available for this sale!");
    }

    // 3️⃣ Reduce stock quantity
    stockItem.quantity -= quantity;
    await stockItem.save();

    // 4️⃣ Save the sale
    const sale = new salesmodel(req.body);
    await sale.save();

    res.redirect('/saleslist');
  } catch (error) {
    console.error("Sale save error:", error.message);
    res.status(500).send("Failed to save sale and update stock");
  }
});


// Manager only: edit/delete
router.get('/sales/edit/:id', ensureManager, async (req, res) => {
  try {
    const sale = await salesmodel.findById(req.params.id);
    res.render('editSale', { sale });
  } catch {
    res.status(404).send("Sale not found");
  }
});

router.post('/sales/edit/:id', ensureManager, async (req, res) => {
  try {
    await salesmodel.findByIdAndUpdate(req.params.id, req.body);
    res.redirect('/saleslist');
  } catch {
    res.status(500).send("Failed to update sale");
  }
});

router.post('/sales/delete/:id', ensureManager, async (req, res) => {
  try {
    await salesmodel.findByIdAndDelete(req.params.id);
    res.redirect('/saleslist');
  } catch {
    res.status(500).send("Failed to delete sale");
  }
});

  


 

// ----------------------
// MANAGER: STOCK
// ----------------------
router.get('/stock', ensureManager, (req, res) => {
  res.render('stock');
});

router.post('/stock', ensureManager, async (req, res) => {
  try {
    const { productName, productType, category, quantity, unitPrice, costPrice, supplierName } = req.body;

    // Always create a new stock entry with its own date
    const stock = new stockModels({
      productName,
      productType,
      category,
      quantity: Number(quantity),
      unitPrice: Number(unitPrice) || 0,
      costPrice: Number(costPrice) || 0,
      supplierName,
      dateReceived: new Date()   // ✅ new entry gets its own date
    });

    await stock.save();

    res.redirect('/stocklist');
  } catch (err) {
    console.error("Error adding stock:", err);
    res.status(500).send("Failed to add stock");
  }
});

router.get('/stocklist', ensureManager, async (req, res) => {
  try {
    const stocks = await stockModels.find().sort({ $natural: -1 });
    res.render('stockTable', { stocks });
  } catch {
    res.status(500).send("Unable to fetch stock records");
  }
});

router.get('/stock/edit/:id', ensureManager, async (req, res) => {
  try {
    const stock = await stockModels.findById(req.params.id);
    res.render('editStock', { stock });
  } catch {
    res.status(500).send("Error loading stock item");
  }
});

router.post('/stock/edit/:id', ensureManager, async (req, res) => {
  try {
    await stockModels.findByIdAndUpdate(req.params.id, req.body);
    res.redirect('/stocklist');
  } catch {
    res.status(500).send("Error updating stock");
  }
});

router.post('/stock/delete/:id', ensureManager, async (req, res) => {
  try {
    await stockModels.findByIdAndDelete(req.params.id);
    res.redirect('/stocklist');
  } catch {
    res.status(500).send("Error deleting stock");
  }
});













// ----------------------
// MANAGER: FINISHED PRODUCTS
// ----------------------
// router.get('/finishedProducts', ensureAuthenticated, ensureManager, async (req, res) => {
//   try {
//     // Fetch all items (no category filter anymore)
//     const finishedItems = await stockModels.find();

//     // Compute totals
//     const totalQuantity = finishedItems.reduce((sum, item) => sum + item.quantity, 0);
//     const totalValue = finishedItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);

//     // Send only the needed fields
//     res.render('finishedProducts', {
//       finishedProducts: {
//         totalQuantity,
//         totalValue,
//         items: finishedItems
//       }
//     });
//   } catch (err) {
//     console.error("Error loading Finished Products:", err);
//     res.status(500).send("Error loading Finished Products page");
//   }
// });


// ----------------------
// MANAGER: sales Records
// ----------------------
// router.get('/salesRecords', ensureAuthenticated, ensureManager, async (req, res) => {
//   try {
//     // ✅ Fetch all sales
//     const items = await salesmodel.find().sort({ $natural: -1 });

//     // ✅ Compute totals
//     let totalSales = 0;
//     let totalQuantitySold = 0;
//     items.forEach(sale => {
//       totalSales += sale.quantity * sale.sellingPrice;
//       totalQuantitySold += sale.quantity;
//     });

//     res.render('salesRecords', {
//       items,               // ✅ so pug can do items.length
//       totalSales,
//       totalQuantitySold,
//       role: req.user.role
//     });
//   } catch (err) {
//     console.error("Error loading Sales Records:", err);
//     res.status(500).send("Error loading Sales Records page");
//   }
// });





// Attendant: generate receipt
router.get('/receiptSales/:id', ensureAuthenticated, ensureAttendant, async (req, res) => {
  try {
    const sale = await salesmodel.findById(req.params.id);
    if (!sale) return res.status(404).send("Sale not found");

    res.render('receiptSales', { sale });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error generating receipt");
  }
});






// reports
router.get('/reports', ensureAuthenticated, ensureManager, async (req, res) => {
  try {
    const salesTotals = await salesmodel.aggregate([
      { $group: { _id: null, totalSales: { $sum: { $multiply: ["$quantity", "$sellingPrice"] } } } }
    ]);
    
    const totalSales = salesTotals[0]?.totalSales || 0;
    
    res.render('reports', { totalSales });
  } catch (err) {
    console.error("Reports error:", err);
    res.status(500).send("Unable to load reports");
  }
});




// ----------------------
// MANAGER: SALES REPORT
// ----------------------
router.get('/salesReport', ensureAuthenticated, ensureManager, async (req, res) => {
  try {
    // ✅ Aggregate monthly sales
    const salesData = await salesmodel.aggregate([
      {
        $group: {
          _id: { $month: "$Date" },
          amount: { $sum: { $multiply: ["$quantity", "$sellingPrice"] } }
        }
      },
      { $sort: { "_id": 1 } }
    ]);

    // Map months (1=Jan, 2=Feb, etc.)
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", 
                        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const formattedData = salesData.map(s => ({
      month: monthNames[s._id - 1],
      amount: s.amount
    }));

    // ✅ Compute total sales
    const totalSales = formattedData.reduce((acc, item) => acc + item.amount, 0);

    res.render("salesReport", {
      title: "Sales Report",
      salesData: formattedData,
      totalSales
    });
  } catch (err) {
    console.error("Sales Report error:", err.message);
    res.status(500).send("Unable to load sales report");
  }
});



























// ----------------------
// MANAGER: EMPLOYEES
// ---------------------

// GET: Show employee list + registration form
router.get('/finishedProducts', ensureAuthenticated, ensureManager, async (req, res) => {
  try {
    const finishedItems = await stockModels.find();

    const totalQuantity = finishedItems.reduce((sum, item) => sum + item.quantity, 0);
    const totalValue = finishedItems.reduce((sum, item) => sum + (item.quantity * (item.costPrice || 0)), 0);

    // ✅ Format table rows with clean date
    const formattedItems = finishedItems.map(item => {
      let formattedDate = "—";
      if (item.dateReceived) {
        try {
          formattedDate = new Date(item.dateReceived).toLocaleDateString("en-GB", {
            day: "2-digit", month: "short", year: "numeric"
          });
        } catch (e) { formattedDate = "—"; }
      }
      return { ...item._doc, formattedDate };
    });

    // ✅ Group stock for chart (combine same productName)
    const grouped = {};
    finishedItems.forEach(item => {
      if (!grouped[item.productName]) {
        grouped[item.productName] = { productName: item.productName, quantity: 0 };
      }
      grouped[item.productName].quantity += item.quantity;
    });

    const chartData = Object.values(grouped);

    res.render("finishedProducts", {
      finishedProducts: {
        totalQuantity,
        totalValue,
        items: formattedItems,
        chartData   // ✅ now included for charts
      }
    });
  } catch (err) {
    console.error("Error loading Finished Products:", err);
    res.status(500).send("Error loading Finished Products page");
  }
});







// GET: Show employee page (list + registration form)
router.get('/employee', ensureAuthenticated, ensureManager, async (req, res) => {
  try {
    const employees = await Employee.find(); // fetch all employees from DB
    res.render('employee', { employees });   // render employee.pug/ejs with data
  } catch (err) {
    console.error("Error loading employee page:", err);
    res.status(500).send("Error loading employee page");
  }
});

// POST: Register new employee
router.post('/employee', ensureAuthenticated, ensureManager, async (req, res) => {
  try {
    const { fullname, email, phone, department, username, password, role } = req.body;

    // create new Employee instance
    const employee = new Employee({ fullname, email, phone, department, username, role });

    // register with passport-local-mongoose to hash password
    await Employee.register(employee, password);

    // redirect back to the same page to see updated list
    res.redirect('/employee');
  } catch (err) {
    console.error("Employee registration error:", err);
    res.status(500).send("Error registering employee");
  }
});

// Optional: Edit, Update, Delete routes

router.get('/edit-employee/:id', ensureAuthenticated, ensureManager, async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) return res.status(404).send("Employee not found");

    const employees = await Employee.find(); // ✅ fetch all employees for the table
    res.render('employee', { employees, editing: employee });
  } catch (err) {
    console.error("Error loading employee for edit:", err);
    res.status(500).send("Error loading edit form");
  }
});


router.post('/delete-employee/:id', ensureAuthenticated, ensureManager, async (req, res) => {
  try {
    await Employee.findByIdAndDelete(req.params.id);
    res.redirect('/employee');
  } catch (err) {
    console.error("Error deleting employee:", err);
    res.status(500).send("Error deleting employee");
  }
});




// POST: update employee
router.post('/edit-employee/:id', ensureAuthenticated, ensureManager, async (req, res) => {
  try {
    await Employee.findByIdAndUpdate(req.params.id, req.body);
    res.redirect('/employee');
  } catch (err) {
    console.error("Error updating employee:", err);
    res.status(500).send("Error updating employee");
  }
});






// POST: Generate report
router.post('/generate', async (req, res) => {
  try {
    const { startDate, endDate, reportType, grouping } = req.body;

    let match = {};
    if (startDate && endDate) {
      match.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // choose model based on report type
    let Model;
    if (reportType === 'sales') Model = salesmodel;
    else if (reportType === 'stock') Model = stockModels;
    else return res.status(400).json({ error: 'Invalid report type' });

    // group by depending on selection (daily, monthly, yearly)
    let format = '%Y-%m-%d';
    if (grouping === 'monthly') format = '%Y-%m';
    if (grouping === 'yearly') format = '%Y';

    const report = await Model.aggregate([
      { $match: match },
      {
        $group: {
          _id: { $dateToString: { format, date: "$date" } },
          total: { $sum: "$amount" } // adjust field name if needed
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({ success: true, data: report });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to generate report" });
  }
});






//report generate
// ----------------------
// REPORT GENERATION FIXED (Sales + Stock)
// ----------------------
// router.get('/reports/generate', ensureAuthenticated, ensureManager, async (req, res) => {
//   try {
//     const { fromDate, toDate, period, reportType } = req.query;

//     if (!fromDate || !toDate) {
//       return res.status(400).send("Please provide both From and To dates.");
//     }

//     const start = new Date(fromDate);
//     const end = new Date(toDate);
//     end.setHours(23, 59, 59, 999);

//     // Determine grouping period
//     let groupFormat = '%Y-%m-%d';
//     if (period === 'weekly') groupFormat = '%Y-%U';
//     if (period === 'monthly') groupFormat = '%Y-%m';
//     if (period === 'yearly') groupFormat = '%Y';

//     let salesData = [];
//     let totalSales = 0;

//     // ✅ SALES REPORT
//     if (reportType === 'sales') {
//       salesData = await salesmodel.aggregate([
//         { $match: { date: { $gte: start, $lte: end } } },
//         {
//           $group: {
//             _id: { $dateToString: { format: groupFormat, date: "$date" } },
//             totalSales: { $sum: { $multiply: ["$quantity", "$sellingPrice"] } },
//             totalQuantity: { $sum: "$quantity" }
//           }
//         },
//         { $sort: { "_id": 1 } }
//       ]);

//       totalSales = salesData.reduce((sum, s) => sum + s.totalSales, 0);
//     }

//     // ✅ STOCK REPORT
//     else if (reportType === 'stock') {
//       salesData = await stockModels.aggregate([
//         { $match: { dateReceived: { $gte: start, $lte: end } } },
//         {
//           $group: {
//             _id: { $dateToString: { format: groupFormat, date: "$dateReceived" } },
//             totalStockValue: { $sum: { $multiply: ["$quantity", "$costPrice"] } },
//             totalQuantity: { $sum: "$quantity" }
//           }
//         },
//         { $sort: { "_id": 1 } }
//       ]);

//       totalSales = salesData.reduce((sum, s) => sum + s.totalStockValue, 0);
//     }

//     res.render('reports', {
//       totalSales,
//       salesData,
//       fromDate,
//       toDate,
//       period,
//       reportType
//     });
//   } catch (err) {
//     console.error("Report generation error:", err);
//     res.status(500).send("Failed to generate report");
//   }
// });


// ----------------------
// REPORT GENERATION WITH FULL DETAILS
// ----------------------
// ----------------------
// REPORTS PAGE - Initial Load
// ----------------------
// ----------------------
// REPORTS PAGE - Initial Load
// ----------------------
router.get('/reports', ensureAuthenticated, ensureManager, async (req, res) => {
  try {
    res.render('reports', {
      reportData: [],  // Changed from null to empty array
      totalAmount: 0,
      totalQuantity: 0,
      fromDate: '',
      toDate: '',
      period: 'daily',
      reportType: 'sales'
    });
  } catch (err) {
    console.error("Reports error:", err);
    res.status(500).send("Unable to load reports");
  }
});

// ----------------------
// REPORT GENERATION WITH FULL DETAILS
// ----------------------
router.get('/reports/generate', ensureAuthenticated, ensureManager, async (req, res) => {
  try {
    const { fromDate, toDate, period, reportType } = req.query;

    if (!fromDate || !toDate) {
      return res.status(400).send("Please provide both From and To dates.");
    }

    const start = new Date(fromDate);
    const end = new Date(toDate);
    end.setHours(23, 59, 59, 999);

    let reportData = [];
    let totalAmount = 0;
    let totalQuantity = 0;

    // ✅ SALES REPORT - Show all individual records
    if (reportType === 'sales') {
      reportData = await salesmodel.find({
        date: { $gte: start, $lte: end }
      }).sort({ date: -1 });

      // Calculate totals
      reportData.forEach(record => {
        totalAmount += record.quantity * record.sellingPrice;
        totalQuantity += record.quantity;
      });
    }

    // ✅ STOCK REPORT - Show all individual records
    else if (reportType === 'stock') {
      reportData = await stockModels.find({
        dateReceived: { $gte: start, $lte: end }
      }).sort({ dateReceived: -1 });

      // Calculate totals
      reportData.forEach(record => {
        totalAmount += record.quantity * (record.costPrice || 0);
        totalQuantity += record.quantity;
      });
    }

    res.render('reports', {
      reportData,
      totalAmount,
      totalQuantity,
      fromDate,
      toDate,
      period,
      reportType
    });
  } catch (err) {
    console.error("Report generation error:", err);
    res.status(500).send("Failed to generate report");
  }
});



module.exports = router;
