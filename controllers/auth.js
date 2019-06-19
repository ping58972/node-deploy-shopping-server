const crypto = require('crypto');

const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
//const sendgridTransport = require('nodemailer-sendgrid-transport');

const { validationResult } = require('express-validator/check');

const User = require('../modles/user');

// const transporter = nodemailer.createTransport(sendgridTransport({
//   auth: {
//     api_key: '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'
//   }
// }));
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'ping4learn@gmail.com',
    pass: '58972pink'
  }
});
//const mailOptions = 

exports.getLogin = (req, res, next) => {
  // const isLoggedIn = req.get('cookie').split(';')[0].trim().split('=')[1] === 'true';
  //console.log(req.session.isLoggedIn);
  //console.log(req.flash('error'));
  let message = req.flash('error');
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
         res.render('auth/login', {
           path: '/login',
           pageTitle: 'Login',
           //isAuthenticated: false
           errorMessage: message,
           oldInput: {email: '', password: ''},
           validationErrors: []
         });
       
   
   };
   exports.getSignup = (req, res, next) => {
    let message = req.flash('error');
    if (message.length > 0) {
      message = message[0];
    } else {
      message = null;
    }
    res.render('auth/signup', {
      path: '/signup',
      pageTitle: 'Signup',
     // isAuthenticated: false
     errorMessage: message,
     oldInput: {email: '', password: '', confirmPassword: ''},
     validationErrors: []

    });
  };
exports.postLogin = (req, res, next) => {
    //req.isLoggedIn = true;
    //res.setHeader('Set-Cookie', 'loggedId=true');
    const email = req.body.email;
    const password = req.body.password;
    //User.findById('5cf8915ffcf7093404b2dca4')
    const errors = validationResult(req);
  if(!errors.isEmpty()){
   // console.log(errors.array());
    return res.status(422).render('auth/login', {
      path: '/login',
      pageTitle: 'Login',
      errorMessage: 'Invalid email or password',
      oldInput: {email:email, password: password},
      validationErrors: errors.array()
    });
  }
    User.findOne({email: email})
    .then(user => {
      if(!user) {
       // req.flash('error', 'Invalid email or password.');
        return res.status(422).render('auth/login', {
          path: '/login',
          pageTitle: 'Login',
          errorMessage: 'Invalid email or password',
          oldInput: {email:email, password: password},
          validationErrors: [] //[{param: 'email', param: 'password'}]
        });
      }
      bcrypt.compare(password, user.password).then(doMatch => {
        if(doMatch) {
          req.session.isLoggedIn = true;
          req.session.user = user;
          return req.session.save((err) => {
            console.log(err);
            return res.redirect('/'); 
          });
        }
        // req.flash('error', 'Invalid email or password.');
        // res.redirect('/login');
        return res.status(422).render('auth/login', {
          path: '/login',
          pageTitle: 'Login',
          errorMessage: 'Invalid email or password',
          oldInput: {email:email, password: password},
          validationErrors: [] //[{param: 'email', param: 'password'}]
        });
      }).catch(err => {
        console.log(err);
        res.redirect('/login');
      });
      
    })
    .catch(err=>{ 
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error); 
  });
   };
   
exports.postSignup = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  //const confirmPassword = req.body.confirmPassword;
  const errors = validationResult(req);
  if(!errors.isEmpty()){
   // console.log(errors.array());
    return res.status(422).render('auth/signup', {
      path: '/signup',
      pageTitle: 'Signup',
      errorMessage: errors.array()[0].msg,
      oldInput: {email:email, password: password, confirmPassword: req.body.confirmPassword},
      validationErrors: errors.array()
    });
  }
  // User.findOne({email: email}).then(userDoc => {
  //   if(userDoc) {
  //     req.flash('error', 'E-mail exist already, please pick a different one!');
  //     return res.redirect('/signup');
  //   }
    // return bcrypt.hash(password, 12)
    bcrypt.hash(password, 12)
    .then(hashedPassword => {
      const user = new User({
        email: email, password: hashedPassword,
        cart: {items: []}
      });
      return user.save();
    }).then( result => {
      res.redirect('/login');
      return transporter.sendMail({
        to: email,
        from: 'ping@ping58972.com',
        subject: 'SignUp succeeded!',
        html: '<h1>You successfully signed up!</h1>'
      });
      
    }).catch(err=>{ 
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error); 
  });
  // })
  // .catch(err=>console.log(err));
};

exports.postLogout = (req, res, next) => {
  req.session.destroy(err => {
    console.log(err);
    res.redirect('/');
  });
};

exports.getReset = (req, res, next) => {
  let message = req.flash('error');
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  res.render('auth/reset', {
    path: '/reset',
    pageTitle: 'Reset Password',
   errorMessage: message
  });
}

exports.postReset = (req, res, next) => {
  crypto.randomBytes(32, (err, buffer) => {
    if(err) {
      console.log(err);
      return res.redirect('/reset');
    }
    const token = buffer.toString('hex');
    User.findOne({email: req.body.email})
    .then(user => {
      if(!user) {
        req.flash('error', 'No account with that email found!');
        return res.redirect('/reset');
      }
      user.resetToken = token;
      user.resetTokenExpiration = Date.now() + 3600000;
      user.save();
    })
    .then(result => {
      res.redirect('/');
      // transporter.sendMail({
      //   to: req.body.email,
      //   from: 'ping@ping58972.com',
      //   subject: 'Password reset',
      //   html: `
      //   <p>You requested a password reset</p>
      //   <p>Click this <a href="http://localhost:3000/reset/${token}">Link</a>to set a new password</p>
      //   `
      // });
      transporter.sendMail({
        from: 'ping4learn@gmail.com',
        to: req.body.email,
        subject: 'Password reset',
        html: `
        <p>You requested a password reset</p>
        <p>Click this <a href="http://localhost:3000/reset/${token}">Link</a>to set a new password</p>
        `
      }, (err, info) => {
        if(err) console.log(err);
        else console.log(info);
      });
    })
    .catch(err=>{ 
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error); 
  });
  });
}

exports.getNewPassword = (req, res, next) => {
  const token = req.params.token;
  User.findOne({resetToken: token, resetTokenExpiration: {$gt: Date.now()}})
  .then(user => {
    let message = req.flash('error');
    if (message.length > 0) {
      message = message[0];
    } else {
      message = null;
    }
           res.render('auth/new-password', {
             path: '/new-password',
             pageTitle: 'New Password',
             errorMessage: message,
             userId: user._id.toString(),
             passwordToken: token
           });
  })
  .catch(err=>{ 
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error); 
});
}

exports.postNewPassword = (req, res, next) => {
  const newPassword = req.body.password;
  const userId = req.body.userId;
  const passwordToken = req.body.passwordToken;
  let resetUser;
  User.findOne({resetToken: passwordToken, resetTokenExpiration: {$gt: Date.now()}, _id: userId})
  .then(user => {
    resetUser = user;
   return bcrypt.hash(newPassword, 12)
  }).then(hashedPassword => {
    resetUser.password = hashedPassword;
    resetUser.resetToken = undefined;
    resetUser.resetTokenExpiration = undefined;
    return resetUser.save();
  })
  .then(()=> {
    res.redirect('/login');
  })
  .catch(err=>{ 
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error); 
});
}