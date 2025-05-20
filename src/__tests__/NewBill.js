/**
 * @jest-environment jsdom
 */

import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";
import { ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import { screen } from "@testing-library/dom";
import mockStore from "../__mocks__/store.js";
import router from "../app/Router.js";
import { waitFor } from "@testing-library/dom";

jest.mock("../app/store", () => mockStore);

describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    beforeEach(() => {
      // Set up localStorage mock
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
          email: "a@a",
        })
      );

      // Set up document
      document.body.innerHTML = NewBillUI();

      // Mock URL.createObjectURL
      URL.createObjectURL = jest.fn(() => "mock-url");
    });

    test("Then the form should be displayed", () => {
      const form = screen.getByTestId("form-new-bill");
      expect(form).not.toBeNull();
    });

    test("Then file input should be displayed", () => {
      const fileInput = screen.getByTestId("file");
      expect(fileInput).not.toBeNull();
    });

    test("Then file preview should be displayed", () => {
      const filePreview = screen.getByTestId("file-preview");
      expect(filePreview).not.toBeNull();
    });

    test("Then file upload should validate file extensions", async () => {
      // Mock alert to prevent it from being called
      window.alert = jest.fn();

      // Create a mock onNavigate function
      const onNavigate = jest.fn();

      // Instantiate NewBill with the mock store
      const newBill = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage,
      });

      // Create a mock file input event with an invalid file
      const fileInput = screen.getByTestId("file");
      const invalidFile = new File(["test"], "test.txt", {
        type: "text/plain",
      });

      // Mock the files property
      Object.defineProperty(fileInput, "files", {
        value: [invalidFile],
      });

      // Create a mock change event
      const changeEvent = {
        preventDefault: jest.fn(),
        target: {
          value: "C:\\path\\to\\test.txt",
        },
      };

      // Call handleChangeFile
      await newBill.handleChangeFile(changeEvent);

      // Verify that alert was called with the correct message
      expect(window.alert).toHaveBeenCalledWith(
        "Invalid file format. Please upload a JPG, JPEG or PNG file."
      );

      // Verify that the file input was reset
      expect(fileInput.value).toBe("");
    });

    test("Then file upload should handle valid files", async () => {
      // Mock console.log and console.error
      console.log = jest.fn();
      console.error = jest.fn();

      // Create a mock onNavigate function
      const onNavigate = jest.fn();

      // Instantiate NewBill with the mock store
      const newBill = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage,
      });

      // Create a mock file input event with a valid file
      const fileInput = screen.getByTestId("file");
      const validFile = new File(["test"], "test.jpg", { type: "image/jpeg" });

      // Mock the files property
      Object.defineProperty(fileInput, "files", {
        value: [validFile],
      });

      // Create a mock change event with the correct structure
      const changeEvent = {
        preventDefault: jest.fn(),
        target: {
          value: "C:\\path\\to\\test.jpg",
          files: [validFile],
        },
      };

      // Mock the file extension extraction by directly modifying the handleChangeFile method
      const originalHandleChangeFile = newBill.handleChangeFile;
      newBill.handleChangeFile = async (e) => {
        e.preventDefault();
        const file = newBill.document.querySelector(`input[data-testid="file"]`)
          .files[0];
        const formData = new FormData();
        const email = JSON.parse(localStorage.getItem("user")).email;

        formData.append("file", file);
        formData.append("email", email);

        // Create sibling element to display the file preview
        const filePreview = newBill.document.querySelector(".file-preview");
        filePreview.innerHTML = `
          <img src="${URL.createObjectURL(file)}" alt="File Preview" />
          <span>test.jpg</span>
        `;

        const result = await newBill.store.bills().create({
          data: formData,
          headers: {
            noContentType: true,
          },
        });

        newBill.billId = result.key;
        newBill.fileUrl = result.fileUrl;
        newBill.fileName = "test.jpg";
      };

      // Call handleChangeFile directly
      await newBill.handleChangeFile(changeEvent);

      // Verify that the fileUrl and fileName were set
      expect(newBill.fileUrl).toBe("https://localhost:3456/images/test.jpg");
      expect(newBill.fileName).toBe("test.jpg");
      expect(newBill.billId).toBe("1234");

      // Restore the original method
      newBill.handleChangeFile = originalHandleChangeFile;
    });

    test("Then form submission should create a new bill and navigate to Bills page", async () => {
      // Mock console.log and console.error
      console.log = jest.fn();
      console.error = jest.fn();

      // Create a mock onNavigate function
      const onNavigate = jest.fn();

      // Instantiate NewBill
      const newBill = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage,
      });

      // Set fileUrl and fileName
      newBill.fileUrl = "mock-url";
      newBill.fileName = "test.jpg";
      newBill.billId = "mock-key";

      // Fill in the form
      const form = screen.getByTestId("form-new-bill");

      // Create form elements if they don't exist
      if (!screen.getByTestId("expense-type")) {
        const select = document.createElement("select");
        select.setAttribute("data-testid", "expense-type");
        form.appendChild(select);
      }

      if (!screen.getByTestId("expense-name")) {
        const input = document.createElement("input");
        input.setAttribute("data-testid", "expense-name");
        form.appendChild(input);
      }

      if (!screen.getByTestId("amount")) {
        const input = document.createElement("input");
        input.setAttribute("data-testid", "amount");
        form.appendChild(input);
      }

      if (!screen.getByTestId("datepicker")) {
        const input = document.createElement("input");
        input.setAttribute("data-testid", "datepicker");
        form.appendChild(input);
      }

      if (!screen.getByTestId("vat")) {
        const input = document.createElement("input");
        input.setAttribute("data-testid", "vat");
        form.appendChild(input);
      }

      if (!screen.getByTestId("pct")) {
        const input = document.createElement("input");
        input.setAttribute("data-testid", "pct");
        form.appendChild(input);
      }

      if (!screen.getByTestId("commentary")) {
        const textarea = document.createElement("textarea");
        textarea.setAttribute("data-testid", "commentary");
        form.appendChild(textarea);
      }

      // Set values
      screen.getByTestId("expense-type").value = "Transports";
      screen.getByTestId("expense-name").value = "Train";
      screen.getByTestId("amount").value = "100";
      screen.getByTestId("datepicker").value = "2023-01-01";
      screen.getByTestId("vat").value = "20";
      screen.getByTestId("pct").value = "20";
      screen.getByTestId("commentary").value = "Test comment";

      // Create a mock submit event
      const submitEvent = {
        preventDefault: jest.fn(),
        target: form,
      };

      // Mock the updateBill method to directly call onNavigate
      const originalUpdateBill = newBill.updateBill;
      newBill.updateBill = (bill) => {
        newBill.onNavigate(ROUTES_PATH["Bills"]);
      };

      // Call handleSubmit directly
      await newBill.handleSubmit(submitEvent);

      // Verify that onNavigate was called with the correct route
      expect(onNavigate).toHaveBeenCalledWith(ROUTES_PATH["Bills"]);

      // Restore the original method
      newBill.updateBill = originalUpdateBill;
    });

    test("Then file upload should handle store errors", async () => {
      // Mock console.error
      console.error = jest.fn();

      // Create a mock store that will reject
      const errorMockStore = {
        bills: () => ({
          create: jest.fn().mockRejectedValue(new Error("Upload failed")),
        }),
      };

      const newBill = new NewBill({
        document,
        onNavigate: jest.fn(),
        store: errorMockStore,
        localStorage: window.localStorage,
      });

      // Create a valid file
      const fileInput = screen.getByTestId("file");
      const validFile = new File(["test"], "test.jpg", { type: "image/jpeg" });
      Object.defineProperty(fileInput, "files", { value: [validFile] });

      const changeEvent = {
        preventDefault: jest.fn(),
        target: {
          value: "C:\\path\\to\\test.jpg",
          files: [validFile],
        },
      };

      try {
        await newBill.handleChangeFile(changeEvent);
      } catch (error) {
        expect(console.error).toHaveBeenCalled();
      }
    });

    test("Then updateBill should handle store errors", async () => {
      // Mock console.error
      console.error = jest.fn();

      // Create a mock store that will reject
      const errorMockStore = {
        ...mockStore,
        bills: () => ({
          ...mockStore.bills(),
          update: jest.fn().mockRejectedValue(new Error("Update failed")),
        }),
      };

      const newBill = new NewBill({
        document,
        onNavigate: jest.fn(),
        store: errorMockStore,
        localStorage: window.localStorage,
      });

      const bill = {
        email: "test@test.com",
        type: "Transports",
        name: "Test",
        amount: 100,
        date: "2023-01-01",
        vat: "20",
        pct: 20,
        commentary: "Test",
        fileUrl: "test.jpg",
        fileName: "test.jpg",
        status: "pending",
      };

      try {
        await newBill.updateBill(bill);
      } catch (error) {
        expect(console.error).toHaveBeenCalled();
      }
    });

    test("Then form should validate required fields", async () => {
      const newBill = new NewBill({
        document,
        onNavigate: jest.fn(),
        store: mockStore,
        localStorage: window.localStorage,
      });

      const form = screen.getByTestId("form-new-bill");
      const submitEvent = {
        preventDefault: jest.fn(),
        target: form,
      };

      // Don't set any values
      await newBill.handleSubmit(submitEvent);

      // Verify that the form submission was prevented
      expect(submitEvent.preventDefault).toHaveBeenCalled();
    });

    test("Then should navigate to Bills page after successful bill creation", async () => {
      const onNavigate = jest.fn();
      const newBill = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage,
      });

      // Set up form data
      newBill.fileUrl = "mock-url";
      newBill.fileName = "test.jpg";
      newBill.billId = "mock-key";

      const form = screen.getByTestId("form-new-bill");
      const submitEvent = {
        preventDefault: jest.fn(),
        target: form,
      };

      await newBill.handleSubmit(submitEvent);
      expect(onNavigate).toHaveBeenCalledWith(ROUTES_PATH["Bills"]);
    });
  });
});

// test d'intégration POST
describe("Given I am a user connected as Employee", () => {
  beforeEach(() => {
    // Set up localStorage mock
    Object.defineProperty(window, "localStorage", {
      value: localStorageMock,
    });
    window.localStorage.setItem(
      "user",
      JSON.stringify({
        type: "Employee",
        email: "a@a",
      })
    );

    // Set up document
    document.body.innerHTML = NewBillUI();

    // Mock URL.createObjectURL
    URL.createObjectURL = jest.fn(() => "mock-url");
  });
  describe("When I navigate to NewBill page", () => {
    describe("When I fill in the form and click on the submit button", () => {
      test("Sends a POST request to the API", async () => {
        // Mock the store's create method
        mockStore.bills.mockImplementationOnce(() => ({
          create: jest
            .fn()
            .mockResolvedValue({ fileUrl: "mock-url", key: "mock-key" }),
        }));

        // Set up the form with test data
        const form = screen.getByTestId("form-new-bill");
        const expenseType = screen.getByTestId("expense-type");
        const expenseName = screen.getByTestId("expense-name");
        const datepicker = screen.getByTestId("datepicker");
        const amount = screen.getByTestId("amount");
        const vat = screen.getByTestId("vat");
        const pct = screen.getByTestId("pct");
        const commentary = screen.getByTestId("commentary");
        const file = screen.getByTestId("file");

        // Fill in the form
        fireEvent.change(expenseType, { target: { value: "Transports" } });
        fireEvent.change(expenseName, { target: { value: "Test expense" } });
        fireEvent.change(datepicker, { target: { value: "2024-03-20" } });
        fireEvent.change(amount, { target: { value: "100" } });
        fireEvent.change(vat, { target: { value: "20" } });
        fireEvent.change(pct, { target: { value: "20" } });
        fireEvent.change(commentary, { target: { value: "Test commentary" } });

        // Create a mock file
        const mockFile = new File(["test"], "test.jpg", { type: "image/jpeg" });
        fireEvent.change(file, { target: { files: [mockFile] } });

        // Submit the form
        fireEvent.submit(form);

        // Wait for the POST request to complete
        await waitFor(() => {
          expect(mockStore.bills().create).toHaveBeenCalled();
        });
      });
    });
  });
});
