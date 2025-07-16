import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { IonIcon } from '@ionic/react';
import { useAccount } from 'wagmi'
import styles from '../styles/Register.module.css'

import {
closeCircle,
walletOutline,
} from 'ionicons/icons';

export const Register = () => {
  const { address, isConnected } = useAccount()
  const [formData, setFormData] = useState({
    walletAddress: '',
    sponsorAddress: '',
    username: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()

  // Auto-fill wallet address when connected (should always be connected due to ProtectedRoute)
  useEffect(() => {
    if (isConnected && address) {
      setFormData(prev => ({
        ...prev,
        walletAddress: address
      }))
    }
  }, [isConnected, address])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target
    setFormData(prev => ({
      ...prev,
      [id]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    // Since we're in a protected route, wallet is guaranteed to be connected
    try {
      // Here you would typically call your API
      console.log('Registering with data:', formData)
      console.log('Connected wallet address:', address)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Navigate to dashboard on success
      navigate('/')
    } catch (error) {
      console.error('Registration failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <div className="section mt-2 text-center">
        <h1>Register now</h1>
        <h4>Create an account</h4>
      </div>

      {/* Connected Wallet Display - Always show since user must be connected to reach this page */}
      <div className="section mb-3 p-2">
        <div className={`card ${styles.walletCard}`}>
          <div className="card-body py-3">
            <div className="d-flex align-items-center">
              <div className="me-3">
                <IonIcon 
                  icon={walletOutline} 
                  className={styles.walletIcon}
                />
              </div>
              <div className="flex-1">
                <h6 className="mb-1 text-success">Wallet Connected</h6>
                <p className="mb-0 small text-muted">
                  <strong>Address:</strong>{' '}
                  <span className={styles.walletAddress}>
                    {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Loading...'}
                  </span>
                </p>
                <p className="mb-0 small text-muted mt-1">
                  This is the wallet address that will be registered to your account
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={`section mb-5 p-2 ${styles.registerContainer}`}>
        <form id="register-form" onSubmit={handleSubmit}>
          <div className="card">
            <div className="card-body">
              <div className="form-group basic">
                <div className="input-wrapper">
                  <label className={`label ${styles.formLabel}`} htmlFor="walletAddress">
                    Your wallet address
                    <span className={styles.autoFilledLabel}>
                      <span className="d-none d-md-inline">(Auto-filled from connected wallet)</span>
                      <span className="d-md-none">✓ Auto-filled</span>
                    </span>
                  </label>
                  <input 
                    type="text" 
                    className={`form-control ${styles.walletInput}`}
                    id="walletAddress" 
                    placeholder="Wallet address auto-filled"
                    value={formData.walletAddress}
                    onChange={handleInputChange}
                    readOnly={true}
                  />
                </div>
              </div>

              <div className="form-group basic">
                <div className="input-wrapper">
                  <label className={`label ${styles.formLabel}`} htmlFor="sponsorAddress">
                    Sponsor address wallet
                  </label>
                  <input 
                    type="text" 
                    className="form-control" 
                    id="sponsorAddress" 
                    placeholder="Enter sponsor wallet address"
                    value={formData.sponsorAddress}
                    onChange={handleInputChange}
                  />
                  <i className="clear-input">
                    <IonIcon icon={closeCircle} />
                  </i>
                </div>
              </div>
{/* 
              <div className="form-group basic">
                <div className="input-wrapper">
                  <label className="label" htmlFor="username" style={{ fontSize: '0.9em' }}>
                    Username
                  </label>
                  <input 
                    type="text" 
                    className="form-control" 
                    id="username" 
                    placeholder="Enter your username"
                    value={formData.username}
                    onChange={handleInputChange}
                  />
                  <i className="clear-input">
                    <IonIcon icon={closeCircle} />
                  </i>
                </div>
              </div> */}

            </div>
          </div>
        </form>

        {/* Register Button - Positioned above terms text */}
        <div className={styles.buttonContainer}>
          <button 
            type="submit" 
            form="register-form"
            className={`btn btn-primary btn-block btn-lg ${isLoading ? 'btn-loading' : ''}`}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Creating your account...
              </>
            ) : (
              <>
                <IonIcon 
                  icon={walletOutline} 
                  className="me-2"
                  style={{ fontSize: '20px' }}
                />
                Register Account
              </>
            )}
          </button>
        </div>

        <div className={styles.termsText}>
          <p>
            By registering, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </>
  )
}