export default defineAppConfig({
  ui: {
    colors: {
      primary: 'teal',
      neutral: 'zinc',
    },
    card: {
      slots: {
        root: 'transition-all duration-200 ease hover:shadow-lg hover:-translate-y-0.5',
        body: 'p-4 sm:p-6',
      },
    },
    button: {
      slots: {
        base: 'cursor-pointer transition-all duration-200 ease',
      },
    },
  },
})
