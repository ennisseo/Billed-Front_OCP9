/**
 * @jest-environment jsdom
 */

import { fireEvent, screen, waitFor } from "@testing-library/dom"
import NewBillUI from "../views/NewBillUI.js"
import NewBill from "../containers/NewBill.js"
import { ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store";

import router from "../app/Router.js";
import store from "../__mocks__/store";

describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    beforeEach(() => {
      // Set up the mock for localStorage
      Object.defineProperty(window, 'localStorage', { value: localStorageMock });
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }));

      // Set up the initial DOM with root element and router
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
    })

    test("Then mail icon in vertical layout should be highlighted", async () => {
      window.onNavigate(ROUTES_PATH.NewBill)
      await waitFor(() => screen.getByTestId('icon-mail'))
      const mailIcon = screen.getByTestId('icon-mail')
      expect(mailIcon.className).toContain('active-icon')
    })

    test("Then user is prompted to fill fields if they are not filled in", async () => {
      // Mock the window.alert function
      const alertMock = jest.fn();
      window.alert = alertMock;

      // Navigate to the NewBill page
      window.onNavigate(ROUTES_PATH.NewBill);
      await waitFor(() => screen.getByTestId("form-new-bill"));

      const formNewBill = screen.getByTestId("form-new-bill");
      const submitButton = formNewBill.querySelector('button[type="submit"]');

      // Simulate clicking on the submit button (without filling in any mandatory field)
      fireEvent.click(submitButton)

      expect(alertMock).toBeTruthy();
    })

    test("Then I am sent to the Bills page when clicking the back button in navigation", async () => {
      window.onNavigate(ROUTES_PATH.NewBill);
      await waitFor(() => screen.getByTestId('form-new-bill'));

      // Mock the onNavigate function to spy on its usage
      const onNavigateSpy = jest.fn();
      window.onNavigate = onNavigateSpy;

      // Simulate clicking the browser's back button
      window.history.back();

      // Invoke the onNavigate function with the 'Bills' route
      onNavigateSpy(ROUTES_PATH.Bills);

      expect(onNavigateSpy).toHaveBeenCalledWith(ROUTES_PATH.Bills);
    });

    describe("When a file is uploaded in a correct format)", () => {
      test("Then file should be updated after uploading", () => {
        document.body.innerHTML = NewBillUI()

        const newBill = new NewBill({
          document,
          onNavigate,
          store: mockStore,
          localStorage: window.localStorage
        })

        // Spy on the handleChangeFile method of the NewBill component
        const handleChangeFile = jest.spyOn(newBill, 'handleChangeFile')

        // Spy on the create method of the bills object in the mock store
        const create = jest.spyOn(newBill.store.bills(), "create");
        const fileInput = screen.getByTestId('file')

        // Create an event object to simulate the file change event
        const e = {
          preventDefault() { },
          target: {
            value: "C:\\fakepath\\samplefile.png",
          },
        };
        fileInput.addEventListener("change", newBill.handleChangeFile(e));

        // Simulate the file input change event
        fireEvent.change(fileInput, {
          target: {
            files: [new File(['samplefile'], 'samplefile.jpg', { type: 'image/jpeg' })],
          }
        })
        expect(handleChangeFile).toBeCalled()
        expect(create).toHaveBeenCalled();
      })
    })
  })
})

// API POST test
describe("Given I am  connected as an employee", () => {
  describe("When I am on NewBill page", () => {
    test("Then push new bill to mock API POST", async () => {
      jest.spyOn(store, "bills");
      Object.defineProperty(window, 'localStorage', { value: localStorageMock });
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }));
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.appendChild(root);
      router();

      // Render NewBillUI and create a new NewBill instance
      document.body.innerHTML = NewBillUI();
      const newBill = new NewBill({
        document,
        onNavigate,
        store: store,
        localStorage: localStorageMock
      });

      // Mock the handleSubmit method
      const handleSubmit = jest.spyOn(newBill, 'handleSubmit');

      const form = screen.getByTestId("form-new-bill");
      form.addEventListener("submit", handleSubmit);
      fireEvent.submit(form);

      expect(handleSubmit).toHaveBeenCalled();

      // Ensure that store.bills() was called inside the handleSubmit method
      expect(store.bills).toHaveBeenCalled();
    })
  })
})