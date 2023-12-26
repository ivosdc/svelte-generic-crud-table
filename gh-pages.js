import { publish } from 'gh-pages';

publish(
  'dist', // path to public directory
  {
    branch: 'gh-pages',
    repo: 'git@github.com:ivosdc/svelte-generic-crud-table.git', // Update to point to your repository
    user: {
      name: 'ivosdc', // update to use your name
      email: 'ibozic@mail.de' // Update to use your email
    },
    dotfiles: true
  },
  () => {
    console.log('Deploy Complete!');
  }
);
