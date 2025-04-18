"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { Dumbbell, Salad, BarChart3, Clock, ArrowUpRight, ChevronRight, Flame, Trophy } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardShell } from "@/components/dashboard-shell"
import { UserProfileCard } from "@/components/user-profile-card"
import { Bar, BarChart, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

type WorkoutPlan = {
  workout_type: string
  days_per_week: number
  equipment_access: string[]
  workout_duration: string
  workouts: {
    day: string
    exercises: {
      name: string
      sets: number
      reps: number
      rest: string
    }[]
  }[]
}

type MealPlan = {
  calories: string
  allergies: string[]
  meals: {
    type: string
    name: string
    calories: number
    protein: number
    carbs: number
    fat: number
  }[]
}

type ProgressData = {
  weight: { date: string; value: number }[]
  workouts_completed: number
  streak: number
  calories_burned: number
  last_workout_day: number
  personal_records: { exercise: string; value: string; date: string }[]
}

type UserProfile = {
  name: string
  age: number
  sex: string
  height: number
  weight: number
  fitness_level: string
  dietary_preference: string
}

var API_URL = process.env.NEXT_PUBLIC_API_URL || "https://fitmatebackend.org"
export default function Dashboard() {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [workoutPlan, setWorkoutPlan] = useState<WorkoutPlan | null>(null)
  const [mealPlan, setMealPlan] = useState<MealPlan | null>(null)
  const [progress, setProgress] = useState<ProgressData | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [lastLogin, setLastLogin] = useState<string | null>(null)

  useEffect(() => {
    if (!user) {
      router.push("/login")
      return
    }

    if (!user.hasProfile) {
      router.push("/profile-setup")
      return
    }

    if (!user.hasMealPlan) {
      router.push("/meal-setup")
      return
    }

    // Simulate fetching data
    const fetchData = async () => {
      setLoading(true)
      try {

        const profileResponse = await fetch(`${API_URL}/api/profile`, {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        })

        if (!profileResponse.ok) {
          throw new Error("Failed to fetch profile")
        }

        const profileData = await profileResponse.json()
        setUserProfile(profileData)

        // In a real app, these would be actual API calls
        const workoutResponse = await fetch(`${API_URL}/api/workout-plan`, {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        })

        if (!workoutResponse.ok) {
          throw new Error("Failed to fetch workout plan")
        }

        const workoutData = await workoutResponse.json()
        setWorkoutPlan(workoutData)

        // Simulated meal plan data
        const mealPlanResponse = await fetch(`${API_URL}/api/meal-plan`, {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        })

        if (!mealPlanResponse.ok) {
          throw new Error("Failed to fetch meal plan")
        }

        const mealPlanData = await mealPlanResponse.json()
        setMealPlan(mealPlanData)

        // fetch progress data
        const progressResponse = await fetch(`${API_URL}/api/progress`, {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        })

        if (!progressResponse.ok) {
          throw new Error("Failed to fetch progress data")
        }

        const progressData = await progressResponse.json()
        setProgress(progressData)

        const currentDate = new Date();
        const dayOfWeek = currentDate.toLocaleDateString("en-US", { weekday: "long" });
        const time = currentDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
        setLastLogin(`${dayOfWeek} ${time}`);
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user, router])


  const handleWorkoutComplete = async () => {
    if (!progress) return;

    try {
      // Get today's date as YYYYMMDD integer
      const today = new Date();
      const formattedToday = parseInt(
        `${today.getFullYear()}${(today.getMonth() + 1).toString().padStart(2, "0")}${today.getDate().toString().padStart(2, "0")}`
      );

      let newStreak = progress.streak;

      // Check if the API provides last_workout_day
      if (progress.last_workout_day) {
        const lastWorkoutDay = progress.last_workout_day;

        if (formattedToday === lastWorkoutDay) {
          // Same day workout, don't increase streak
          newStreak = progress.streak;
        } else if (formattedToday === lastWorkoutDay + 1) {
          // Consecutive day, increase streak
          newStreak = progress.streak + 1;
        } else {
          // Missed a day, reset streak
          newStreak = 1;
        }
      }

      // Update progress
      const randomCalories = Math.floor(Math.random() * (500 - 300 + 1)) + 300;
      const updatedProgress = {
        ...progress,
        workouts_completed: progress.workouts_completed + 1,
        streak: newStreak,
        calories_burned: progress.calories_burned + randomCalories,
        last_workout_day: formattedToday,
      };

      const response = await fetch(`${API_URL}/api/progress`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user?.token}`,
        },
        body: JSON.stringify(updatedProgress),
      });
      console.log(user)

      if (!response.ok) {
        throw new Error("Failed to finish workout");
      }

      const popup = document.createElement("div");
      popup.className = "fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50";
      popup.innerHTML = `
        <div class="bg-white p-6 rounded-lg shadow-lg flex flex-col items-center">
          <div class="animate-bounce text-green-500 text-4xl">✔</div>
          <p class="mt-2 text-gray-700">Workout Completed!</p>
          <p class="mt-2 text-gray-700">Streak: ${newStreak}</p>
          <p class="mt-2 text-gray-700">Generating new workout ...</p>
        </div>
      `;
      document.body.appendChild(popup);

      // Close popup after animation and update the state
      const removePopup = () => {
        document.body.removeChild(popup);
        setProgress(updatedProgress);
      };

      const newWorkoutResponse = await fetch(`${API_URL}/api/generate-new-workout`, {
        headers: {
          Authorization: `Bearer ${user?.token}`,
        },
      });

      if (!newWorkoutResponse.ok) {
        removePopup();
        throw new Error("Failed to fetch new workout plan");
      }

      const newWorkoutData = await newWorkoutResponse.json();
      setWorkoutPlan(newWorkoutData);
      removePopup();
    } catch (error) {
      console.error("Error finishing workout:", error);
    }
  };

  return (
    <DashboardShell>
      <DashboardHeader
        heading={`Welcome, ${userProfile?.name?.split(" ")[0] || "User"}`}
        text="View your fitness journey and progress at a glance"
      >
        <Button
          className="bg-cyan-600 hover:bg-cyan-700 transition-colors"
          onClick={handleWorkoutComplete}
        >
          Finish Workout <ArrowUpRight className="ml-2 h-4 w-4" />
        </Button>

      </DashboardHeader>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="h-20 bg-muted/50"></CardHeader>
              <CardContent className="h-24 bg-muted/30"></CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <>
          {/* Stats Overview */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Workout Streak</CardTitle>
                <Flame className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{progress?.streak} days</div>
                <p className="text-xs text-muted-foreground">Keep it up! You're building consistency.</p>
              </CardContent>
            </Card>
            <Card className="border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Workouts Completed</CardTitle>
                <Trophy className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{progress?.workouts_completed}</div>
                <p className="text-xs text-muted-foreground">Total workouts since you started</p>
              </CardContent>
            </Card>
            <Card className="border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Calories Burned</CardTitle>
                <Flame className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {progress?.calories_burned.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">Total calories burned this month</p>
              </CardContent>
            </Card>
            <Card className="border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Todays Day</CardTitle>
                <Clock className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{lastLogin?.split(" ")[0]}</div>
                <p className="text-xs text-muted-foreground">at {lastLogin?.split(" ")[1]}</p>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 mt-4">
            {/* Workout Plan */}
            <Card className="col-span-4 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="bg-gray-50 dark:bg-gray-800 rounded-t-lg">
                <CardTitle className="flex items-center text-gray-800 dark:text-white">
                  <Dumbbell className="mr-2 h-5 w-5 text-cyan-600" /> Today's Workout
                </CardTitle>
                <CardDescription>Your personalized workout for today</CardDescription>
              </CardHeader>
              <CardContent className="px-2">
                <div className="space-y-4">
                  {workoutPlan?.workouts[ Math.floor(Math.random() * 4)].exercises.map((exercise, i) => (
                    <div
                      key={i}
                      className="flex items-center p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-100 text-cyan-600 dark:bg-cyan-900 dark:text-cyan-400">
                        {i + 1}
                      </div>
                      <div className="ml-4 space-y-1">
                        <p className="text-sm font-medium leading-none">{exercise.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {exercise.sets} sets × {exercise.reps} reps • {exercise.rest} rest
                        </p>
                      </div>
                      <div className="ml-auto">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-gray-500 hover:text-cyan-600 hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full bg-cyan-600 hover:bg-cyan-700 transition-colors"
                  onClick={handleWorkoutComplete}
                >Finish Workout</Button>
              </CardFooter>
            </Card>

            {/* User Profile Card */}
            <Card className="col-span-3 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
              {userProfile && (
                <UserProfileCard
                  name={userProfile.name}
                  age={userProfile.age}
                  sex={userProfile.sex}
                  height={userProfile.height}
                  weight={userProfile.weight}
                  fitness_level={userProfile.fitness_level}
                  dietary_preference={userProfile.dietary_preference}
                />
              )}
            </Card>
          </div>

          {/* Meal Plan */}
          <div className="mt-4">
            <Card className="border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="bg-gray-50 dark:bg-gray-800 rounded-t-lg">
                <CardTitle className="flex items-center text-gray-800 dark:text-white">
                  <Salad className="mr-2 h-5 w-5 text-blue-600" /> Today's Meals
                </CardTitle>
                <CardDescription>Your personalized meal plan for today</CardDescription>
              </CardHeader>
              <CardContent className="px-2">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {mealPlan?.meals.map((meal, i) => (
                    <div
                      key={i}
                      className="flex flex-col p-4 rounded-lg border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <div className="flex items-center mb-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400 text-xs">
                          {meal.type.charAt(0)}
                        </div>
                        <div className="ml-2 font-medium">{meal.type}</div>
                      </div>
                      <div className="text-sm font-medium mb-2">{meal.name}</div>
                      <div className="mt-auto">
                        <div className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-1">
                          {meal.calories} calories
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span className="text-cyan-600 dark:text-cyan-400">P: {meal.protein}g</span>
                          <span className="text-blue-600 dark:text-blue-400">C: {meal.carbs}g</span>
                          <span className="text-orange-500">F: {meal.fat}g</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Progress Section */}
            <div className="mt-4">
            <Card className="border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="bg-gray-50 dark:bg-gray-800 rounded-t-lg">
              <CardTitle className="flex items-center text-gray-800 dark:text-white">
                <BarChart3 className="mr-2 h-5 w-5 text-blue-600" /> Your Progress
              </CardTitle>
              <CardDescription>Track your fitness journey and achievements</CardDescription>
              </CardHeader>
              <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Workout Streak</p>
                  <p className="text-2xl font-bold text-orange-500">{progress?.streak || 0} days</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Workouts Completed</p>
                  <p className="text-2xl font-bold text-cyan-600">{progress?.workouts_completed || 0}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Calories Burned</p>
                  <p className="text-2xl font-bold text-red-500">
                  {progress?.calories_burned?.toLocaleString() || 0} kcal
                  </p>
                </div>
                </div>

                {/* Chart Visualization */}
                <div className="h-[250px] w-full bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-center border border-gray-200 dark:border-gray-700">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={[
                          {
                            name: "Stats",
                            Streak: progress?.streak || 0,
                            Workouts: progress?.workouts_completed || 0,
                            Calories: progress?.calories_burned || 0,
                          },
                        ]}
                        layout="vertical"
                      >
                        <XAxis type="number" stroke="#94a3b8" />
                        <YAxis
                          dataKey="name"
                          type="category"
                          stroke="#94a3b8"
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#1e293b",
                            borderColor: "#94a3b8",
                          }}
                        />
                        <Legend />
                        <Bar
                          dataKey="Streak"
                          fill="#f97316"
                          name="Workout Streak"
                        />
                        <Bar
                          dataKey="Workouts"
                          fill="#06b6d4"
                          name="Workouts Completed"
                        />
                        <Bar
                          dataKey="Calories"
                          fill="#ef4444"
                          name="Calories Burned"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
              </div>
              </CardContent>
            </Card>
            </div>
        </>
      )}
    </DashboardShell>
  )
}
