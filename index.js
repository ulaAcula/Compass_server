import express from "express";
import bcrypt from "bcrypt";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
const Url = `mongodb+srv://reyulugbek:3ROemKX4SJMns0Eu@cluster.umnl8k2.mongodb.net/?retryWrites=true&w=majority`;
import UserModel from "./models/User.js";
import TaskModel from "./models/Task.js";
import AccountModel from "./models/Account.js";
import ExpensesModel from "./models/Expenses.js";
import IncomeModel from "./models/Income.js";
import PlanModel from "./models/Plan.js";
mongoose
  .connect(Url)
  .then(() => console.log("Connected!"))
  .catch((err) => {
    console.log("error", err);
  });
const app = express();
app.use(express.json());
app.use((req, res, next) => {
  res.header(
    "Access-Control-Allow-Origin",
    "https://compass-server.onrender.com"
  );
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});
// app.use((req, res, next) => {
//   res.header("Access-Control-Allow-Origin", "*");
//   res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
//   res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
//   next();
// });
const authenticateUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await UserModel.findOne({ email });

    const isAuth = await bcrypt.compare(password, user.password);

    if (!user) {
      return res.status(401).json({ error: `user not find` });
    }

    if (isAuth) {
      const token = jwt.sign({ userId: user._id, email: user.email }, "sssqq", {
        expiresIn: "24h",
      });
      res.json({ token, id: user._id, email: user.email });
      next();
    } else {
      res.status(401).json({ message: "accaund data is wrong" });
    }
  } catch (error) {
    next(error);
  }
};

const registerUser = async (req, res, next) => {
  try {
    const { email, password, firstName, lastName, avatarUrl } = req.body;
    const hashPass = await bcrypt.hash(password, 10);
    const newUser = new UserModel({
      email,
      firstName,
      lastName,
      avatarUrl,
      password: hashPass,
    });
    const exsistedUser = await UserModel.findOne({ email });
    if (exsistedUser) {
      return res.status(400).json({ error: `${email} already exsist` });
    }
    newUser.save();
    next();
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal server error.");
  }
};
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization;

  if (!token) {
    return res.status(401).json({ message: "requare token of avtorization" });
  }
  jwt.verify(token, "sssqq", (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: "invalid token" });
    } else {
      req.user = decoded;
      next();
    }
  });
};

const getAccounts = async (req, res) => {
  const user = req.user.userId;
  const Accounts = await AccountModel.find({ user });
  res.json({ Accounts: Accounts });
};

const createAccount = async (req, res) => {
  const { categoryName, balance, category, type, description } = req.body;
  const user = req.user.userId;

  if (!categoryName) {
    return res.status(400).json({ message: "empty title" });
  }

  const existingAccount = await AccountModel.findOne({
    categoryName,
    user: user,
    type,
  });

  if (existingAccount) {
    return res.status(400).json({
      error: `${categoryName} already exists for this user`,
      message: "Account already exists",
    });
  }
  const unchange = balance;
  const newDescription = description !== undefined ? description : "";
  const newBalance = new AccountModel({
    categoryName,
    balance,
    user,
    category,
    type,
    description: newDescription,
    unchangingBalance: unchange,
  });
  await newBalance.save();

  res.json({ message: "excellent save" });
};
const editAccount = async (req, res) => {
  try {
    const AccountId = req.params.id;
    const { categoryName, balance, type, category, description } = req.body;

    if (!AccountId) {
      return res.status(400).json({ message: "not entered id" });
    }

    const updatedFields = {};
    if (categoryName !== undefined) {
      updatedFields.categoryName = categoryName;
    }

    if (balance !== undefined) {
      updatedFields.balance = balance;
    }
    if (type !== undefined) {
      updatedFields.type = type;
    }
    if (category !== undefined) {
      updatedFields.category = category;
    }
    if (description !== undefined) {
      updatedFields.description = description;
    }

    const updatedAccount = await AccountModel.findByIdAndUpdate(
      AccountId,
      { $set: updatedFields },
      { new: true }
    );

    if (!updatedAccount) {
      return res.status(404).json({ error: "Account not found" });
    }

    res.json({ message: "Account has updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
const createExpenses = async (req, res) => {
  try {
    const { amount, yourAccount, balance, memo, list, Expenses } = req.body;
    const userId = req.user.userId;

    if (!amount) {
      return res.status(400).json({ message: "Empty amount for expenses" });
    }

    const newExpenses = new ExpensesModel({
      amount,
      yourAccount: yourAccount,
      balance,
      list,
      memo,
      user: userId,
      Type: false,
    });

    const account = await AccountModel.findOne({
      user: userId,
      categoryName: yourAccount,
    });

    if (!account) {
      return res.status(404).json({ message: "Account not found" });
    }

    account.balance -= parseInt(amount);
    await newExpenses.save();
    await account.save();

    res.json({ message: "Expense saved successfully" });
  } catch (error) {
    console.error("Error creating expenses:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
const createIncome = async (req, res) => {
  try {
    const { amount, yourAccount, balance, memo, list } = req.body;
    const userId = req.user.userId;

    if (!amount) {
      return res.status(400).json({ message: "Empty amount for expenses" });
    }

    const newExpenses = new IncomeModel({
      amount,
      yourAccount,
      user: userId,
      balance,
      memo,
      list,
      Type: true,
    });

    const account = await AccountModel.findOne({
      user: userId,
      categoryName: yourAccount,
    });

    if (!account) {
      return res.status(404).json({ message: "Account not found" });
    }

    account.balance += Number(amount);
    await newExpenses.save();
    await account.save();

    res.json({ message: "Expense saved successfully" });
  } catch (error) {
    console.error("Error creating expenses:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const editTask = async (req, res) => {
  try {
    const taskId = req.params.id;
    const { title, description, completed } = req.body;

    if (!taskId) {
      return res.status(400).json({ message: "not entered id" });
    }

    const updatedFields = {};
    if (title !== undefined) {
      updatedFields.title = title;
    }

    if (description !== undefined) {
      updatedFields.description = description;
    }
    if (completed !== undefined) {
      updatedFields.completed = completed;
    }

    const updatedTask = await TaskModel.findByIdAndUpdate(
      taskId,
      { $set: updatedFields },
      { new: true }
    );

    if (!updatedTask) {
      return res.status(404).json({ error: "task not found" });
    }

    res.json({ message: "task has updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
const deleteTask = async (req, res) => {
  try {
    const taskId = req.params.id;

    if (!taskId) {
      return res.status(400).json({ message: "not entered id" });
    }

    const deletedTask = await TaskModel.findByIdAndDelete(taskId);

    if (!deletedTask) {
      return res.status(404).json({ error: "task not found" });
    }

    res.json({ message: "task has been deleted successfully", deletedTask });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const delateAccount = async (req, res) => {
  try {
    const AccountId = req.params.id;

    if (!AccountId) {
      return res.status(400).json({ message: "not entered id" });
    }

    const AccountTask = await AccountModel.findByIdAndDelete(AccountId);

    if (!AccountTask) {
      return res.status(404).json({ error: "task not found" });
    }

    res.json({ message: "task has been deleted successfully", AccountTask });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
const createPlan = async (req, res) => {
  const { plan } = req.body;
  const user = req.user.userId;

  if (!plan) {
    return res.status(400).json({ message: "empty title" });
  }

  const newPlan = new PlanModel({ plan, user: user });
  await newPlan.save();
  res.json({ message: "excellent save" });
};
const getPlan = async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(400).json({ message: "User not authenticated" });
    }

    const user = req.user.userId;
    const allPlans = await PlanModel.find({ user });

    const updatedPlans = allPlans.map((plan) => {
      const updatedData = plan.plan.map((category) => {
        let totalAvailable = 0;

        const updatedListCategory = category.nameListCategory.map((item) => {
          const availableValue = Number(
            (item.assigned - item.activity).toFixed(2)
          );
          const formattedAvailable =
            availableValue % 1 == 0 ? `${availableValue}` : `${availableValue}`;
          const formattedActivity =
            item.activity % 1 === 0 ? `${item.activity}` : `${item.activity}`;
          const property =
            item.assigned > item.activity
              ? "Spent"
              : item.assigned < item.activity
              ? "Overspent"
              : "Fully Spent";

          totalAvailable += availableValue;

          return {
            ...item,
            property: property,
            available: formattedAvailable,
            activity: formattedActivity,
          };
        });

        const totalActivity = updatedListCategory.reduce(
          (total, item) => total + Number(item.activity),
          0
        );

        const totalAssigned = updatedListCategory.reduce(
          (total, item) => total + Number(item.assigned),
          0
        );

        return {
          ...category,
          nameListCategory: updatedListCategory,
          totalAmount: totalAvailable.toFixed(2),
          totalActivity: totalActivity.toFixed(2),
          totalAssigned: totalAssigned.toFixed(2),
        };
      });

      return {
        ...plan.toObject(),
        data: updatedData,
      };
    });

    res.json(updatedPlans);
  } catch (error) {
    console.error("Error fetching and processing plans:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
const editPlan = async (req, res) => {
  try {
    const PlanId = req.params.id;
    const { plan } = req.body;

    if (!PlanId || !mongoose.Types.ObjectId.isValid(PlanId)) {
      return res.status(400).json({ message: "Invalid PlanId" });
    }

    const updatedFields = {};
    if (plan !== undefined) {
      updatedFields.plan = plan;
    }

    const updatedPlan = await PlanModel.findByIdAndUpdate(
      PlanId,
      { $set: updatedFields },
      { new: true }
    );

    if (!updatedPlan) {
      return res.status(404).json({ error: "Plan not found" });
    }

    res.json({ message: "Plan has been updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
const getAccountsId = async (req, res) => {
  const accountId = req.params.id;

  try {
    const account = await AccountModel.findById(accountId);

    if (!account) {
      return res.status(404).json({ error: "Учетная запись не найдена" });
    }

    res.json({ account: account });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Внутренняя ошибка сервера" });
  }
};
const getExpensesAndIncome = async (req, res) => {
  try {
    const user = req.user.userId;
    const account = req.params.account;
    const query = { user, yourAccount: account };

    const expenses = await ExpensesModel.find(query);
    const income = await IncomeModel.find(query);

    const allTransactions = expenses.concat(income);

    const sortedTransactions = allTransactions.sort((a, b) => {
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    res.json({ transactions: sortedTransactions });
  } catch (error) {
    console.error("Error in getExpensesAndIncome:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
const getExpenses = async (req, res) => {
  try {
    const user = req.user.userId;
    const account = req.params.account;
    const query = { user, yourAccount: account };

    const Expenses = await ExpensesModel.find(query);
    res.json({ Expenses: Expenses });
  } catch (error) {
    console.error("Error in getExpenses:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
const getIncome = async (req, res) => {
  try {
    const user = req.user.userId;
    const account = req.params.account;
    const query = { user, yourAccount: account };

    const Income = await IncomeModel.find(query);
    res.json({ Income: Income });
  } catch (error) {
    console.error("Error in getIncome:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
const delateExpense = async (req, res) => {
  try {
    const expenseId = req.params.id;

    if (!expenseId) {
      return res.status(400).json({ message: "not entered id" });
    }

    const expense = await ExpensesModel.findById(expenseId);

    if (!expense) {
      return res.status(404).json({ error: "expense not found" });
    }

    const account = await AccountModel.findOne({
      categoryName: expense.yourAccount,
    });

    if (!account) {
      return res.status(404).json({ error: "account not found" });
    }

    account.balance += expense.amount;
    await account.save();

    const expenseDeleted = await ExpensesModel.findByIdAndDelete(expenseId);

    res.json({
      message: "expense has been processed successfully",
      expense: expenseDeleted,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
const delateIncome = async (req, res) => {
  try {
    const IncomeId = req.params.id;

    if (!IncomeId) {
      return res.status(400).json({ message: "not entered id" });
    }

    const Income = await IncomeModel.findById(IncomeId);

    if (!Income) {
      return res.status(404).json({ error: "Income not found" });
    }

    const account = await AccountModel.findOne({
      categoryName: Income.yourAccount,
    });

    if (!account) {
      return res.status(404).json({ error: "account not found" });
    }

    account.balance -= Income.amount;
    await account.save();

    const IncomeDeleted = await IncomeModel.findByIdAndDelete(IncomeId);

    res.json({
      message: "Income has been processed successfully",
      expense: IncomeDeleted,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

app.delete("/Expensedelate/:id", delateExpense);
app.delete("/Incomedelate/:id", delateIncome);

app.delete("/deleteAccount/:id", delateAccount);
app.delete("/delete/:id", deleteTask);
app.put("/edit/:id", editTask);
app.post("/login", authenticateUser);
app.post("/register", registerUser);

app.get("/getAccount", verifyToken, getAccounts);
app.get("/getAccountBy/:id", verifyToken, getAccountsId);
app.post("/create/Account", verifyToken, createAccount);
app.put("/editAccount/:id", editAccount);
app.post("/create/Expenses", verifyToken, createExpenses);
app.get("/getExpenses/:account", verifyToken, getExpenses);
app.get("/getIncome/:account", verifyToken, getIncome);
app.get("/getIncomeAndExpenses/:account", verifyToken, getExpensesAndIncome);

// app.get("/Get/Expenses", verifyToken, getExpenses);

app.post("/create/Income", verifyToken, createIncome);
app.post("/createPlan", verifyToken, createPlan);
app.get("/getPlan", verifyToken, getPlan);
app.put("/editPlan/:id", editPlan);
app.listen(4034, () => {
  console.log(`server  http://localhost:4034/`);
});
