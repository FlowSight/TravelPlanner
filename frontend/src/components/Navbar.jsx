import { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Button,
  Text,
  Toolbar,
  ToolbarButton,
  ToolbarDivider,
  Menu,
  MenuTrigger,
  MenuPopover,
  MenuList,
  MenuItem,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import {
  Airplane24Regular,
  SignOut24Regular,
  Person24Regular,
  Map24Regular,
  Settings24Regular,
  ChevronDown20Regular,
} from '@fluentui/react-icons';
import { useAuth } from '../context/AuthContext';

const useStyles = makeStyles({
  navbar: {
    backgroundColor: tokens.colorBrandBackground,
    padding: '0 24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: '56px',
    boxShadow: tokens.shadow4,
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer',
    textDecoration: 'none',
    color: tokens.colorNeutralForegroundOnBrand,
  },
  rightSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
});

export default function Navbar() {
  const styles = useStyles();
  const { user, logoutUser } = useAuth();
  const navigate = useNavigate();

  return (
    <div className={styles.navbar}>
      <Link to="/" className={styles.brand} style={{ textDecoration: 'none' }}>
        <Airplane24Regular />
        <Text size={500} weight="bold" style={{ color: 'inherit' }}>
          Travel Planner
        </Text>
      </Link>
      <div className={styles.rightSection}>
        {user ? (
          <>
            <ToolbarButton
              icon={<Map24Regular />}
              onClick={() => navigate('/places')}
              style={{ color: tokens.colorNeutralForegroundOnBrand }}
            >
              Places
            </ToolbarButton>
            <ToolbarButton
              icon={<Airplane24Regular />}
              onClick={() => navigate('/trips')}
              style={{ color: tokens.colorNeutralForegroundOnBrand }}
            >
              My Trips
            </ToolbarButton>
            {user.role === 'admin' && (
              <ToolbarButton
                icon={<Settings24Regular />}
                onClick={() => navigate('/manage')}
                style={{ color: tokens.colorNeutralForegroundOnBrand }}
              >
                Manage
              </ToolbarButton>
            )}
            <ToolbarDivider />
            <Menu>
              <MenuTrigger disableButtonEnhancement>
                <Button
                  appearance="subtle"
                  icon={<Person24Regular />}
                  style={{ color: tokens.colorNeutralForegroundOnBrand }}
                >
                  {user.name} <ChevronDown20Regular style={{ marginLeft: 4 }} />
                </Button>
              </MenuTrigger>
              <MenuPopover>
                <MenuList>
                  <MenuItem
                    icon={<Person24Regular />}
                    onClick={() => navigate('/profile')}
                  >
                    Profile
                  </MenuItem>
                  <MenuItem
                    icon={<SignOut24Regular />}
                    onClick={() => {
                      logoutUser();
                      navigate('/login');
                    }}
                  >
                    Logout
                  </MenuItem>
                </MenuList>
              </MenuPopover>
            </Menu>
          </>
        ) : (
          <>
            <Button appearance="subtle" onClick={() => navigate('/login')} style={{ color: '#fff' }}>
              Login
            </Button>
            <Button appearance="subtle" onClick={() => navigate('/register')} style={{ color: '#fff' }}>
              Register
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
