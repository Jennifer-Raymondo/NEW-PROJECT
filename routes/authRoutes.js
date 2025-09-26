const express = require('express');
const router = express.Router();
const passport = require('passport');
const Employee = require('../models/employeeModel')



// Models
const User = require('../models/userModel');
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
    const { username, password, role } = req.body;
    const user = new User({ username, role });
    await User.register(user, password); // passport-local-mongoose
    res.redirect('/login');
  } catch (err) {
    console.error("Signup error:", err);
    res.send(" Error signing up user. Make sure username is unique.");
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
router.get('/dashboard', ensureAuthenticated, async (req, res) => {
  try {
    // 🚫 Attendants should never see the dashboard
    if (req.user.role === 'attendant') {
      return res.redirect('/saleslist');
    }
    
    // 🔹 Aggregate stock by category
    const stockTotals = await stockModels.aggregate([
      {
        $group: {
          _id: "$category", // finished products / raw materials
          totalQuantity: { $sum: "$quantity" },
          totalCost: { $sum: { $multiply: ["$quantity", "$costPrice"] } }
        }
      }
    ]);

    // Split by category
    const finishedProducts = stockTotals.find(item => item._id === "finished products") || { totalCost: 0, totalQuantity: 0 };
    const rawMaterials = stockTotals.find(item => item._id === "raw material") || { totalCost: 0, totalQuantity: 0 };

    // Grand total stock expense
    const totalStockExpense = stockTotals.reduce((acc, item) => acc + item.totalCost, 0);

    // 🔹 Aggregate sales total
   const salesTotals = await salesmodel.aggregate([
  {
    $group: {
      _id: null,
      totalSales: { $sum: { $multiply: ["$quantity", "$sellingPrice"] } } // ✅ compute total revenue
    }
  }
]);
    const totalSales = salesTotals[0]?.totalSales || 0;

    // Render dashboards based on role
    if (req.user.role === "manager") {
      return res.render("dashboard", {
        title: "Manager Dashboard",
        user: req.user,
        totalStockExpense,
        totalSales,
        finishedProducts,
        rawMaterials,
      });
    } else if (req.user.role === "attendant") {
      return res.render("attendant-dashboard", {
        title: "Attendant Dashboard",
        user: req.user
      });
    }

    res.redirect("/login");
  } catch (error) {
    console.error("Dashboard aggregation error:", error.message);
    res.status(500).send("Unable to load dashboard data");
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




// SALES list: both roles can see
router.get('/saleslist', ensureAuthenticated, async (req, res) => {
  try {
    const items = await salesmodel.find().sort({ $natural: -1 });
    res.render('salesTable', {
      items,
      role: req.user.role // send role to Pug to hide buttons for attendants
    });
  } catch (error) {
    res.status(500).send("Unable to get sales records");
  }
});

// Record a sale: allow both roles
router.get('/sales', ensureAuthenticated, (req, res) => {
  res.render('sales', { title: 'Record Sale', role: req.user.role });
});

router.post('/sales', ensureAuthenticated, async (req, res) => {
  try {
    const sale = new salesmodel(req.body);
    await sale.save();
    res.redirect('/saleslist');
  } catch (error) {
    res.status(500).send("Failed to save sale");
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
    const stock = new stockModels(req.body);
    await stock.save();
    res.redirect('/stocklist');
  } catch {
    res.redirect('/dashboard');
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
router.get('/finishedProducts', ensureAuthenticated, ensureManager, async (req, res) => {
  try {
    const finishedItems = await stockModels.find({ category: 'finished products' });

const totalQuantity = finishedItems.reduce((sum, item) => sum + item.quantity, 0);
const totalValue = finishedItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
const categories = [...new Set(finishedItems.map(i => i.productType))].length;

res.render('finishedProducts', {
  finishedProducts: {
    totalQuantity,
    totalValue,
    categories,
    items: finishedItems
  }
});
  } catch (err) {
    console.error(err);
    res.status(500).send("Error loading Finished Products page");
  }
});

// ----------------------
// MANAGER: RAW MATERIALS
// ----------------------
router.get('/rawMaterials', ensureAuthenticated, ensureManager, async (req, res) => {
  try {
    const rawItems = await stockModels.find({ category: 'raw material' });

    const totalQuantity = rawItems.reduce((sum, item) => sum + item.quantity, 0);
    const totalExpense = rawItems.reduce((sum, item) => sum + (item.quantity * item.costPrice), 0);


    // ✅ count suppliers here
    const suppliers = await stockModels.distinct("supplierName", { category: "raw material" });
    const totalSuppliers = suppliers.length;

    // Example dummy trends
    const trends = [
      { month: 'Jan', usage: 50 },
      { month: 'Feb', usage: 70 },
      { month: 'Mar', usage: 60 },
      { month: 'Apr', usage: 80 },
      { month: 'May', usage: 40 }
    ];

    res.render('rawMaterials', {
      rawMaterials: {
        totalQuantity,
        totalExpense,
        suppliers: totalSuppliers,
        items: rawItems,
        trends
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error loading Raw Materials page");
  }
});







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
    // 🔹 Aggregate stock by category
    const stockTotals = await stockModels.aggregate([
      {
        $group: {
          _id: "$category",
          totalQuantity: { $sum: "$quantity" },
          totalCost: { $sum: { $multiply: ["$quantity", "$costPrice"] } }
        }
      }
    ]);

    // Split categories
    const finishedProducts = stockTotals.find(item => item._id === "finished products") || { totalCost: 0, totalQuantity: 0 };
    const rawMaterials = stockTotals.find(item => item._id === "raw material") || { totalCost: 0, totalQuantity: 0 };

    // Grand total stock expense
    const totalStockExpense = stockTotals.reduce((acc, item) => acc + item.totalCost, 0);

    // 🔹 Aggregate sales total
    const salesTotals = await salesmodel.aggregate([
      {
        $group: {
          _id: null,
          totalSales: { $sum: { $multiply: ["$quantity", "$sellingPrice"] } }
        }
      }
    ]);
    const totalSales = salesTotals[0]?.totalSales || 0;

    // ✅ Now render reports page with the variables defined
    res.render("reports", {
      totalSales,
      totalStockExpense,
      finishedProducts,
      rawMaterials
    });

  } catch (err) {
    console.error("Reports error:", err.message);
    res.status(500).send("Unable to load reports");
  }
});

















// ----------------------
// MANAGER: EMPLOYEES
// ---------------------

// GET: Show employee list + registration form
router.get('/employee', ensureAuthenticated, ensureManager, async (req, res) => {
  try {
    const employees = await Employee.find(); // fetch all employees
    res.render('employee', { employees });   // pass to pug
  } catch (err) {
    console.error("Error fetching employees:", err);
    res.status(500).send("Error loading employee list");
  }
});


// ✅ GET: Show signup form
// router.get('/signup', ensureAuthenticated, ensureManager, (req, res) => {
//   res.render('signup'); // <-- this matches your signup.pug file
// });



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










module.exports = router;
